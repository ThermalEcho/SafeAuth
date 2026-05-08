import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No database URL found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const email = 'testuser@example.com';
const password = 'TestPassword123!';

async function findUserTable() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%user%';");
  const names = res.rows.map(r => r.table_name.toLowerCase());
  if (names.includes('users')) return 'users';
  if (names.includes('user')) return 'user';
  // fallback: pick first with 'user' in name
  const first = res.rows[0];
  return first ? first.table_name : null;
}

async function main() {
  try {
    const userTable = await findUserTable();
    if (!userTable) {
      console.error('Could not find users table');
      process.exit(1);
    }

    console.log('Using user table:', userTable);

    const userRes = await pool.query(`SELECT id, email FROM "${userTable}" WHERE email = $1 LIMIT 1`, [email]);
    if (userRes.rowCount === 0) {
      console.error('No user found with email', email);
      process.exit(1);
    }

    const user = userRes.rows[0];
    console.log('Found user id:', user.id);

    // Update emailVerified camelCase column
    try {
      await pool.query(`UPDATE "${userTable}" SET "emailVerified" = true WHERE id = $1`, [user.id]);
      console.log('Set emailVerified = true for', email);
    } catch (err) {
      console.warn('Failed to update camelCase column, trying lowercase column...', err.message);
      try {
        await pool.query(`UPDATE "${userTable}" SET emailverified = true WHERE id = $1`, [user.id]);
        console.log('Set emailverified = true for', email);
      } catch (err2) {
        console.error('Failed to set email verified column:', err2.message);
      }
    }

    // Attempt sign-in
    const signInRes = await fetch('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const signInBody = await signInRes.text();
    try {
      console.log('Sign-in status:', signInRes.status);
      console.log('Sign-in response:', JSON.stringify(JSON.parse(signInBody), null, 2));
    } catch (parseErr) {
      console.log('Sign-in raw response:', signInBody);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error in verify-and-signin:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
