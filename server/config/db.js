const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is NOT defined in environment variables!');
} else {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log('✅ DATABASE_URL detected. Host:', dbUrl.hostname);
  } catch (e) {
    console.error('❌ DATABASE_URL is defined but INVALID format:', e.message);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

const getClient = async () => {
  return pool.connect();
};

module.exports = { pool, query, getClient };
