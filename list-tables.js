import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    res.rows.forEach(row => console.log(row.table_name));
    await pool.end();
  } catch (err) {
    console.error(err.message);
    await pool.end();
    process.exit(1);
  }
})();
