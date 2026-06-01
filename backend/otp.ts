import { fromNodeHeaders } from "better-auth/node";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { auth } from "./auth.ts";
import { pool } from "./db.ts";

const OTP_ROUTE_PREFIX = "/api/otp/accounts";
const DEFAULT_ALGORITHM = "SHA1";
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD_SECONDS = 30;
const MAX_SECRET_LENGTH = 256;
const MAX_TEXT_LENGTH = 120;
const AES_ALGORITHM = "aes-256-gcm";
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const UNAUTHORIZED_MESSAGE = "Authentication required";
const INVALID_SECRET_MESSAGE = "Enter a valid TOTP secret.";

interface AuthenticatedSession {
  user: {
    id: string;
  };
}

interface OtpCreateBody {
  accountName?: string;
  issuer?: string;
  label?: string;
  otpauthUrl?: string;
  secret?: string;
}

interface ParsedOtpInput {
  accountName: string;
  algorithm: string;
  digits: number;
  issuer: string;
  period: number;
  secret: string;
}

interface EncryptedSecret {
  authTag: string;
  ciphertext: string;
  iv: string;
}

interface OtpAccountRow {
  id: string;
  account_name: string;
  issuer: string;
  secret_ciphertext: string;
  secret_iv: string;
  secret_auth_tag: string;
  algorithm: string;
  digits: number;
  period: number;
  created_at: Date;
}

interface OtpAccountResponse {
  accountName: string;
  code: string;
  createdAt: string;
  digits: number;
  id: string;
  issuer: string;
  period: number;
  remainingSeconds: number;
}

function deriveSecretKey(): Buffer {
  const keyMaterial = process.env.OTP_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET;

  if (!keyMaterial) {
    throw new Error("OTP_ENCRYPTION_KEY or BETTER_AUTH_SECRET is required");
  }

  return createHash("sha256").update(keyMaterial).digest();
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function normalizeSecret(secret: string): string {
  return secret.replace(/\s|-/g, "").toUpperCase();
}

function decodeBase32(secret: string): Buffer {
  const normalizedSecret = normalizeSecret(secret).replace(/=+$/g, "");
  let bits = "";
  const bytes: number[] = [];

  for (const character of normalizedSecret) {
    const value = BASE32_ALPHABET.indexOf(character);

    if (value === -1) {
      throw new Error(INVALID_SECRET_MESSAGE);
    }

    bits += value.toString(2).padStart(5, "0");
  }

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  if (bytes.length === 0) {
    throw new Error(INVALID_SECRET_MESSAGE);
  }

  return Buffer.from(bytes);
}

function parseOtpAuthUrl(otpauthUrl: string): Partial<ParsedOtpInput> {
  const url = new URL(otpauthUrl);

  if (url.protocol !== "otpauth:" || url.hostname !== "totp") {
    throw new Error("Only TOTP QR codes are supported.");
  }

  const rawLabel = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const [labelIssuer, ...accountParts] = rawLabel.split(":");
  const issuer = sanitizeText(url.searchParams.get("issuer") ?? labelIssuer);
  const accountName = sanitizeText(accountParts.join(":") || labelIssuer);
  const secret = sanitizeText(url.searchParams.get("secret"));
  const algorithm = sanitizeText(url.searchParams.get("algorithm") ?? DEFAULT_ALGORITHM).toUpperCase();
  const digits = Number.parseInt(url.searchParams.get("digits") ?? String(DEFAULT_DIGITS), 10);
  const period = Number.parseInt(url.searchParams.get("period") ?? String(DEFAULT_PERIOD_SECONDS), 10);

  return {
    accountName,
    algorithm,
    digits,
    issuer,
    period,
    secret,
  };
}

function parseOtpInput(body: OtpCreateBody): ParsedOtpInput {
  const parsedFromUrl = body.otpauthUrl ? parseOtpAuthUrl(body.otpauthUrl) : {};
  const secret = sanitizeText(body.secret ?? parsedFromUrl.secret);
  const normalizedSecret = normalizeSecret(secret);
  const accountName = sanitizeText(body.accountName ?? parsedFromUrl.accountName ?? body.label);
  const issuer = sanitizeText(body.issuer ?? parsedFromUrl.issuer);
  const algorithm = sanitizeText(parsedFromUrl.algorithm ?? DEFAULT_ALGORITHM).toUpperCase();
  const digits = parsedFromUrl.digits ?? DEFAULT_DIGITS;
  const period = parsedFromUrl.period ?? DEFAULT_PERIOD_SECONDS;

  if (!normalizedSecret || normalizedSecret.length > MAX_SECRET_LENGTH) {
    throw new Error(INVALID_SECRET_MESSAGE);
  }

  decodeBase32(normalizedSecret);

  if (algorithm !== DEFAULT_ALGORITHM) {
    throw new Error("Only SHA1 TOTP entries are supported.");
  }

  if (!Number.isInteger(digits) || digits < 6 || digits > 8) {
    throw new Error("TOTP digits must be between 6 and 8.");
  }

  if (!Number.isInteger(period) || period < 15 || period > 120) {
    throw new Error("TOTP period must be between 15 and 120 seconds.");
  }

  return {
    accountName: accountName || "Account",
    algorithm,
    digits,
    issuer: issuer || "Authenticator",
    period,
    secret: normalizedSecret,
  };
}

function encryptSecret(secret: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(AES_ALGORITHM, deriveSecretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);

  return {
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
  };
}

function decryptSecret(row: OtpAccountRow): string {
  const decipher = createDecipheriv(
    AES_ALGORITHM,
    deriveSecretKey(),
    Buffer.from(row.secret_iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(row.secret_auth_tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(row.secret_ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function fingerprintSecret(userId: string, secret: string): string {
  return createHmac("sha256", deriveSecretKey()).update(`${userId}:${secret}`).digest("hex");
}

function hashLabel(input: ParsedOtpInput): string {
  return createHash("sha256")
    .update(`${input.issuer.toLowerCase()}:${input.accountName.toLowerCase()}`)
    .digest("hex");
}

function generateTotp(secret: string, period: number, digits: number, now = Date.now()): string {
  const key = decodeBase32(secret);
  const counter = Math.floor(now / 1000 / period);
  const counterBuffer = Buffer.alloc(8);

  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = binary % 10 ** digits;

  return code.toString().padStart(digits, "0");
}

function getRemainingSeconds(period: number, now = Date.now()): number {
  return period - (Math.floor(now / 1000) % period);
}

function toOtpAccountResponse(row: OtpAccountRow): OtpAccountResponse {
  const secret = decryptSecret(row);

  return {
    accountName: row.account_name,
    code: generateTotp(secret, row.period, row.digits),
    createdAt: row.created_at.toISOString(),
    digits: row.digits,
    id: row.id,
    issuer: row.issuer,
    period: row.period,
    remainingSeconds: getRemainingSeconds(row.period),
  };
}

async function getAuthenticatedSession(request: FastifyRequest): Promise<AuthenticatedSession | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user?.id) {
    return null;
  }

  return session as AuthenticatedSession;
}

function sendUnauthorized(reply: FastifyReply): FastifyReply {
  return reply.status(401).send({ error: UNAUTHORIZED_MESSAGE });
}

function constantTimeUserIdEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function registerOtpRoutes(fastify: FastifyInstance): void {
  fastify.get(OTP_ROUTE_PREFIX, async (request, reply) => {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return sendUnauthorized(reply);
    }

    const result = await pool.query<OtpAccountRow>(
      `select id::text, account_name, issuer, secret_ciphertext, secret_iv, secret_auth_tag,
              algorithm, digits, period, created_at
         from public.otp_account
        where user_id = $1
        order by issuer asc, account_name asc`,
      [session.user.id],
    );

    return reply.send({ accounts: result.rows.map(toOtpAccountResponse) });
  });

  fastify.post<{ Body: OtpCreateBody }>(OTP_ROUTE_PREFIX, async (request, reply) => {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return sendUnauthorized(reply);
    }

    let parsedInput: ParsedOtpInput;

    try {
      parsedInput = parseOtpInput(request.body ?? {});
    } catch (error: unknown) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : INVALID_SECRET_MESSAGE,
      });
    }

    const encryptedSecret = encryptSecret(parsedInput.secret);
    const result = await pool.query<OtpAccountRow>(
      `insert into public.otp_account (
          user_id, issuer, account_name, label_hash, secret_ciphertext, secret_iv,
          secret_auth_tag, secret_fingerprint, algorithm, digits, period
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        on conflict (user_id, secret_fingerprint) do update set
          issuer = excluded.issuer,
          account_name = excluded.account_name,
          label_hash = excluded.label_hash,
          updated_at = now()
        returning id::text, account_name, issuer, secret_ciphertext, secret_iv, secret_auth_tag,
                  algorithm, digits, period, created_at`,
      [
        session.user.id,
        parsedInput.issuer,
        parsedInput.accountName,
        hashLabel(parsedInput),
        encryptedSecret.ciphertext,
        encryptedSecret.iv,
        encryptedSecret.authTag,
        fingerprintSecret(session.user.id, parsedInput.secret),
        parsedInput.algorithm,
        parsedInput.digits,
        parsedInput.period,
      ],
    );

    return reply.status(201).send({ account: toOtpAccountResponse(result.rows[0]) });
  });

  fastify.delete<{ Params: { id: string } }>(`${OTP_ROUTE_PREFIX}/:id`, async (request, reply) => {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return sendUnauthorized(reply);
    }

    const result = await pool.query<{ user_id: string }>(
      "select user_id from public.otp_account where id = $1",
      [request.params.id],
    );

    if (result.rowCount === 0) {
      return reply.status(404).send({ error: "OTP account not found" });
    }

    if (!constantTimeUserIdEquals(result.rows[0].user_id, session.user.id)) {
      return reply.status(404).send({ error: "OTP account not found" });
    }

    await pool.query("delete from public.otp_account where id = $1", [request.params.id]);

    return reply.status(204).send();
  });
}
