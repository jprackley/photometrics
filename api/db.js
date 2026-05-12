const { Pool } = require('pg');
require('dotenv').config();

const isSSL = (process.env.PGSSLMODE || '').toLowerCase() === 'require';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    max: 10, // tune for your deployment
    idleTimeoutMillis: 30_000,
});

// Small helper that logs and rethrows
async function query(text, params) {
    try {
        return await pool.query(text, params);
    } catch (err) {
        // Optionally add structured logging here
        throw err;
    }
}

module.exports = { pool, query };