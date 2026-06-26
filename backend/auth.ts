import bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { admin, bearer } from "better-auth/plugins";
import dotenv from "dotenv";
import { BrevoClient } from "@getbrevo/brevo";
import { fileURLToPath } from "node:url";
import { pool } from "./db.ts";

// -----------------------------------------------------------------------------
// Environment and domain constants
// -----------------------------------------------------------------------------

const ENV_FILE_PATH = fileURLToPath(String(new URL("../.env", import.meta.url)));
const DEFAULT_AUTH_BASE_URL = "http://localhost:3000";
const DEFAULT_APP_SCHEME = "safeauth";
const TRUSTED_ORIGINS_SEPARATOR = ",";
const EMAIL_HASH_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const SESSION_REFRESH_SECONDS = 60 * 60 * 24;
const EMAIL_VERIFICATION_DURATION_SECONDS = 24 * 60 * 60;
const VERIFICATION_EMAIL_SUBJECT = "Verify your email for SafeAuth";
const VERIFICATION_BUTTON_COLOR = "#007bff";
const VERIFICATION_BUTTON_TEXT_COLOR = "white";
const VERIFICATION_EMAIL_HTML_FONT = "Arial, sans-serif";

dotenv.config({ path: ENV_FILE_PATH });

interface VerificationEmailContext {
  user: {
    email?: string;
  };
  url: string;
}

interface EmailSender {
  email: string;
  name: string;
}

/**
 * Returns a configured Brevo client when an API key is available.
 *
 * @returns A Brevo client or `null` when email delivery is disabled.
 */
function createBrevoClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new BrevoClient({ apiKey });
}

/**
 * Converts "Name <address@example.com>" into Brevo's sender shape.
 *
 * @param value - The configured sender identity.
 * @returns The parsed sender name and email address.
 */
function parseEmailSender(value: string | undefined): EmailSender {
  const match = value?.trim().match(/^(.+?)\s*<([^<>\s]+@[^<>\s]+)>$/);

  if (!match) {
    throw new Error(
      "EMAIL_FROM must use the format \"SafeAuth <your-verified-sender@example.com>\"",
    );
  }

  return {
    name: match[1].trim(),
    email: match[2].trim(),
  };
}

/**
 * Builds the Better Auth trusted origin list for web and native callbacks.
 */
function parseTrustedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(TRUSTED_ORIGINS_SEPARATOR)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getSchemeTrustedOrigin(): string {
  const scheme = process.env.EXPO_SCHEME?.trim() || DEFAULT_APP_SCHEME;

  return scheme.endsWith("://") ? scheme : `${scheme.replace(/:\/\/$/, "")}://`;
}

function getTrustedOriginFromUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }

    return `${url.protocol}//`;
  } catch {
    return null;
  }
}

function getTrustedOrigins(authBaseUrl: string): string[] {
  return Array.from(
    new Set(
      [
        getTrustedOriginFromUrl(authBaseUrl),
        getSchemeTrustedOrigin(),
        getTrustedOriginFromUrl(process.env.EXPO_PUBLIC_VERIFICATION_CALLBACK_URL),
        ...parseTrustedOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS),
      ].filter((origin): origin is string => Boolean(origin)),
    ),
  );
}

/**
 * Hashes a plaintext password using the configured bcrypt work factor.
 *
 * @param input - The password payload from Better Auth.
 * @returns A bcrypt hash for the supplied password.
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, EMAIL_HASH_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 *
 * @param input - The bcrypt hash and candidate password.
 * @returns `true` when the password matches the hash; otherwise `false`.
 */
async function verifyPassword(input: { hash: string; password: string }): Promise<boolean> {
  return bcrypt.compare(input.password, input.hash);
}

/**
 * Builds the fallback HTML used for verification emails.
 *
 * @param verificationUrl - The link users must open to verify their account.
 * @returns A self-contained HTML email template.
 */
function buildVerificationEmailHtml(verificationUrl: string): string {
  return `
    <div style="font-family: ${VERIFICATION_EMAIL_HTML_FONT}; max-width: 600px;">
      <h2>Verify your email</h2>
      <p>Welcome to SafeAuth! Click the link below to verify:</p>
      <p>
        <a
          href="${verificationUrl}"
          style="background: ${VERIFICATION_BUTTON_COLOR}; color: ${VERIFICATION_BUTTON_TEXT_COLOR}; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;"
        >
          Verify Email
        </a>
      </p>
      <p>Link expires in 24 hours.</p>
    </div>
  `;
}

/**
 * Logs the verification URL when Brevo is not configured.
 *
 * @param emailAddress - The user's email address.
 * @param verificationUrl - The verification link that would have been sent.
 */
function logFallbackVerificationUrl(emailAddress: string, verificationUrl: string): void {
  console.log(`Verification URL for ${emailAddress}:`, verificationUrl);
}

/**
 * Logs an error in a consistent shape for email delivery failures.
 *
 * @param error - The unknown error thrown by the email provider.
 */
function logEmailDeliveryError(error: unknown): void {
  if (error instanceof Error) {
    console.error("Email error:", error.message);
    return;
  }

  console.error("Email error:", error);
}

const brevoClient = createBrevoClient();
const authBaseUrl = process.env.BETTER_AUTH_URL ?? DEFAULT_AUTH_BASE_URL;

/**
 * Sends the verification email or logs the fallback URL when email delivery
 * is not configured.
 *
 * @param context - The Better Auth verification payload.
 */
async function sendVerificationEmail(context: VerificationEmailContext): Promise<void> {
  const { user, url } = context;
  const email = user.email;

  if (!email) {
    console.error("Verification email skipped: user email is missing");
    return;
  }

  try {
    if (brevoClient === null) {
      logFallbackVerificationUrl(email, url);
      return;
    }

    const sender = parseEmailSender(process.env.EMAIL_FROM);
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      sender,
      to: [{ email }],
      subject: VERIFICATION_EMAIL_SUBJECT,
      htmlContent: buildVerificationEmailHtml(url),
      textContent: `Verify your SafeAuth email by opening this link: ${url}`,
    });

    console.log("Verification email sent:", {
      id: response.messageId,
      recipient: email,
    });
  } catch (error: unknown) {
    logEmailDeliveryError(error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Better Auth configuration
// -----------------------------------------------------------------------------

export const auth = betterAuth({
  database: pool,
  baseURL: authBaseUrl,
  trustedOrigins: getTrustedOrigins(authBaseUrl),
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  session: {
    expiresIn: SESSION_DURATION_SECONDS,
    updateAge: SESSION_REFRESH_SECONDS,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: EMAIL_VERIFICATION_DURATION_SECONDS,
    sendVerificationEmail,
  },
  plugins: [admin(), bearer()],
});
