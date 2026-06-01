import bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { admin, bearer } from "better-auth/plugins";
import { Resend } from "resend";
import { pool } from "./db.ts";

// -----------------------------------------------------------------------------
// Environment and domain constants
// -----------------------------------------------------------------------------

const DEFAULT_AUTH_BASE_URL = "http://localhost:3000";
const DEFAULT_EMAIL_FROM = "SafeAuth <onboarding@resend.dev>";
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

interface VerificationEmailContext {
  user: {
    email?: string;
  };
  url: string;
}

/**
 * Returns a configured Resend client when an API key is available.
 *
 * @returns A Resend client or `null` when email delivery is disabled.
 */
function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
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
 * Logs the verification URL when Resend is not configured.
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

const resendClient = createResendClient();
const emailFromAddress = process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;

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
    if (resendClient === null) {
      logFallbackVerificationUrl(email, url);
      return;
    }

    await resendClient.emails.send({
      from: emailFromAddress,
      to: email,
      subject: VERIFICATION_EMAIL_SUBJECT,
      html: buildVerificationEmailHtml(url),
    });

    console.log("Verification email sent to:", email);
  } catch (error: unknown) {
    logEmailDeliveryError(error);
    console.log("Fallback URL:", url);
  }
}

// -----------------------------------------------------------------------------
// Better Auth configuration
// -----------------------------------------------------------------------------

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? DEFAULT_AUTH_BASE_URL,
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  schema: {
    user: {
      additionalFields: {
        password: {
          type: "string",
          input: true,
          returned: false,
          required: false,
        },
      },
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
    autoSignInAfterVerification: false,
    expiresIn: EMAIL_VERIFICATION_DURATION_SECONDS,
    sendVerificationEmail,
  },
  plugins: [admin(), bearer()],
});
