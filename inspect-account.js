import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const userId = '9kFSKxhhhWfaGSIFisv8dWhYX53BSoiS';

(async () => {
  try {
    const res = await pool.query("SELECT * FROM account WHERE userid = $1", [userId]);
    console.log('Found', res.rowCount, 'rows');
    if (res.rowCount > 0) console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err.message);
    await pool.end();
    process.exit(1);
  }
})();
