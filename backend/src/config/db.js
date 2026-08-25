import pg from 'pg';

const { Pool } = pg;

// Render's external database URLs require SSL; local/internal connections don't.
const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
