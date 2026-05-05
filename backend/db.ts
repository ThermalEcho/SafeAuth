// db.ts - Database connection pool for Better Auth
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import pkg from 'pg';

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const { Pool } = pkg;

const connectionString =
  process.env.SUPABASE_POOLER_URL ||
  process.env.DATABASE_POOLER_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for the Better Auth PostgreSQL connection.');
}

if (!process.env.SUPABASE_POOLER_URL && !process.env.DATABASE_POOLER_URL) {
  const databaseUrl = new URL(connectionString);
  if (databaseUrl.hostname.endsWith('.supabase.co')) {
    console.warn(
      'Supabase direct host detected. If the backend cannot reach it from this network, set SUPABASE_POOLER_URL or DATABASE_POOLER_URL to your Supabase pooler connection string.'
    );
  }
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // required for Supabase
  },
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};
