import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";

// -----------------------------------------------------------------------------
// Environment configuration
// -----------------------------------------------------------------------------

const ENV_FILE_PATH = fileURLToPath(String(new URL("../.env", import.meta.url)));
const DATABASE_ENV_KEYS = [
  "SUPABASE_POOLER_URL",
  "DATABASE_POOLER_URL",
  "DATABASE_URL",
] as const;
const DATABASE_SSL_OPTIONS = { rejectUnauthorized: false } as const;
const DATABASE_CONNECTION_REQUIRED_MESSAGE = "DATABASE_URL is required";
const DATABASE_PING_QUERY = "SELECT 1";

dotenv.config({ path: ENV_FILE_PATH });

/**
 * Resolves the first available database connection string from the supported
 * environment variables.
 *
 * @returns The database connection string used by the shared connection pool.
 * @throws {Error} When none of the supported environment variables are set.
 */
function resolveConnectionString(): string {
  for (const environmentKey of DATABASE_ENV_KEYS) {
    const value = process.env[environmentKey];

    if (value) {
      return value;
    }
  }

  throw new Error(DATABASE_CONNECTION_REQUIRED_MESSAGE);
}

// -----------------------------------------------------------------------------
// Shared pool
// -----------------------------------------------------------------------------

export const pool = new Pool({
  connectionString: resolveConnectionString(),
  ssl: DATABASE_SSL_OPTIONS,
});

// -----------------------------------------------------------------------------
// Diagnostics
// -----------------------------------------------------------------------------

/**
 * Verifies that the shared PostgreSQL pool can execute a simple query.
 *
 * @returns A promise that resolves when the connection check succeeds.
 */
export async function testConnection(): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query(DATABASE_PING_QUERY);
    console.log("Database connection successful");
  } finally {
    client.release();
  }
}
