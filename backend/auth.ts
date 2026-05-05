import bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { Resend } from "resend";
import { pool } from "./db.ts";

// Initialize Resend email client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email sender - configure based on environment
const emailFrom = process.env.EMAIL_FROM || "SafeAuth <onboarding@resend.dev>";

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000", // Set base URL for Better Auth
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChar: false,
      hash: async (password: string) => {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cache: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 24 * 60 * 60, // 24 hours
    sendVerificationEmail: async ({ user, url, token }) => {
      try {
        if (!resend) {
          console.warn("RESEND_API_KEY not configured. Email verification link:");
          console.log(`Email: ${user.email}`);
          console.log(`Verification URL: ${url}`);
          return;
        }

        const { data, error } = await resend.emails.send({
          from: emailFrom,
          to: user.email,
          subject: "Verify your email address for SafeAuth",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Verify your email address</h2>
              <p>Welcome to SafeAuth! Please verify your email address by clicking the link below:</p>
              <p style="margin: 24px 0;">
                <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Verify Email
                </a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${url}</p>
              <p style="margin-top: 24px; font-size: 12px; color: #999;">
                This link will expire in 24 hours.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error("Resend email error:", error);
          console.log("Verification URL fallback for", user.email, ":", url);
        } else {
          console.log("Verification email sent to:", user.email, "| Message ID:", data?.id);
        }
      } catch (error) {
        console.error("Verification email failed:", error);
        console.log("Verification URL fallback for", user.email, ":", url);
      }
    },
  },
  plugins: [admin()],
});
