// auth.ts - Better Auth server configuration
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins";
import bcrypt from "bcrypt";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  emailAndPassword: {
    enabled: true,
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
  user: {
    additionalFields: {
      name: {
        type: "string",
        required: true,
        input: true,
        returnToClient: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cache: false,
  },
  plugins: [admin()],
});
