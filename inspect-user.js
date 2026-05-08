import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const email = 'testuser@example.com';

(async () => {
  try {
    const userRes = await pool.query("SELECT * FROM \"user\" WHERE email = $1 LIMIT 1", [email]);
    if (userRes.rowCount === 0) {
      console.log('User not found');
      process.exit(0);
    }
    console.log(JSON.stringify(userRes.rows[0], null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
    await pool.end();
    process.exit(1);
  }
})();
