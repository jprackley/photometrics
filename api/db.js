const { Pool } = require('pg');
const path = require('path');

// Attempt to load .env.local. If failed to load .env
//.env.local is an optional local IDE file
try {
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (log) {
    console.log('[local:dev log]', log)
}
require('dotenv').config();

const isSSL = (process.env.PGSSLMODE || '').toLowerCase() === 'require';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
    console.error('[pg:pool error]', err);
});

async function query(text, params) {
    const start = Date.now();
    try {
        // Optional per-query timeout via statement_timeout for providers that support it
        // For a one-off, you can prefix with `SET LOCAL statement_timeout = 10000;`
        return await pool.query(text, params);
    } catch (err) {
        console.error('[pg:query error]', { text, params, ms: Date.now() - start, err });
        throw err;
    }
}

async function healthcheck() {
    const start = Date.now();
    try {
        await pool.query('SELECT 1');
        console.log('[db:ok]', Date.now() - start, 'ms');
        return { ok: true };
    } catch (err) {
        console.error('[db:fail]', err);
        return { ok: false, error: err.message };
    }
}

module.exports = { pool, query, healthcheck };