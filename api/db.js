const { Pool } = require('pg');
const path = require('path');

// Load env for local dev; on Vercel, env vars come from the platform
try {
    // Prefer .env.local if present; otherwise fallback to default .env
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (_) {
    // noop
}
require('dotenv').config();

const isSSL = (process.env.PGSSLMODE || '').toLowerCase() === 'require';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
});

async function query(text, params) {
    return pool.query(text, params);
}

module.exports = { pool, query };