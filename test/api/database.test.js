const { describe, test } = require('node:test');
const assert = require('node:assert')
const { healthcheck } = require("../../api/db");
/**
 * Test suite for the database connection.
 *
 * This suite verifies that the database module can successfully connect
 * to the configured database and return a valid healthcheck response.
 */
describe('[test]: database connection', () => {
    /**
     * Verifies that the database healthcheck returns an ok response.
     *
     * The `healthcheck()` function should return an object with `ok`
     * set to `true` when the database connection is working correctly.
     *
     * @throws {AssertionError} If the database healthcheck does not return ok.
     */
    test('db healthcheck returns ok', async () => {
        const response = await healthcheck();
        assert.equal(response.ok, true, 'Database healthcheck failed');
    });
});