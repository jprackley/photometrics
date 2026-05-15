const { describe, test, before, after } = require('node:test');
const assert = require('node:assert')
const { pool, healthcheck } = require("../../api/db");

describe('[test]: database connection', () => {
    test('db healthcheck returns ok', async () => {
        const response = await healthcheck();
        assert.equal(response.ok, true, 'Database healthcheck failed');
    });
});