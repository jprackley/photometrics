/**
 * Client API integration test suite.
 *
 * Tests the `/api/clients` endpoint for create, read, update, and delete behavior.
 * Uses Node's built in test runner, Supertest, shared test data builders, and
 * shared assertion helpers.
 */
const {test, describe, after, before} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_CLIENT = require('../../utils/constants/cClients');

const { createTestClient } = require('../helpers/createTests');
const {deleteTestClients} = require("../helpers/deleteTests");
const {buildTestClient} = require("../helpers/testBuilders");
const {assertEqualReturn, assertEqual} = require("../helpers/assertTests");

/**
 * Stores client IDs created during the test run.
 *
 * The IDs are reused by read, update, and delete tests, then removed during
 * cleanup so test data does not remain in the database.
 *
 * @type {string[]}
 */
const clients = []

const testSuiteName = 'clientTestSuite';

/**
 * Test suite for the `/api/clients` route group.
 *
 * Creates one reusable client before the tests run, executes endpoint tests,
 * and destroys created test clients after the suite completes.
 */
describe('Testing /api/clients', () => {
    /**
     * Creates seed client data required by later read, update, and delete tests.
     *
     * @returns {Promise<void>}
     */
    before(async () => {
        console.log('[PRE] Creating Test Data...');

        const rows = await createTestClient(
            C_CLIENT.REQUIRED_COLUMNS,
            testSuiteName
        );
        clients.push(rows.client_id);
    })

    /**
     * Removes test clients created during the suite.
     *
     * @returns {Promise<void>}
     */
    after(async () => {

        console.log('[POST] Destroying Test Data...');
        clients.length = await deleteTestClients(clients, 'clients');
    });
    //-------------------------------------------------------------------------------------------------------------
    //         CREATE CLIENT TESTS
    //-------------------------------------------------------------------------------------------------------------

    /**
     * Tests client creation behavior for valid, missing, and overrun payload values.
     */
    describe('[API]: CREATE client', () => {

        /**
         * Verifies that a valid client payload creates a new client and returns HTTP 201.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: CREATE valid entry [EXPECTED] status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/clients')
                .send( buildTestClient( 'client' ) );


            const body = await assertEqualReturn(response, C_HTTP.STATUS.CREATED)
            if (body.client_id !== undefined) {
                clients.push(body.client_id);
                console.log(`Created Client with ID: ${response.body.client_id}`);
            }
        });

        /**
         * Verifies that omitting each required client field returns HTTP 400.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: CREATE Client with missing required fields [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`,
            async () => {
                for (const field of Object.values(C_CLIENT.REQUIRED_COLUMNS)) {
                    const response = await request(app).post('/api/clients')
                        .send( buildTestClient( 'client', field ) );

                    const body = await assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
                    if (body.client_id !== undefined) {
                        console.log(`Created Client with ID: ${response.body.client_id}`);
                        clients.push(body.client_id);
                    }
                }
            }
        );

        /**
         * Verifies that omitting each optional client field still creates a client.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: CREATE Client with missing optional fields [EXPECTED] status code ${C_HTTP.STATUS.CREATED}`,
            async () => {
                for (const field of Object.values(C_CLIENT.MUTABLE_COLUMNS)) {
                    const response = await request(app).post('/api/clients')
                        .send( buildTestClient( 'client', field ) );

                    const body = await assertEqualReturn(response, C_HTTP.STATUS.CREATED);
                    if (body.client_id !== undefined) {
                        console.log(`Created Client with ID: ${response.body.client_id}`);
                        clients.push(body.client_id);
                    }
                }
            }
        );

        /**
         * Verifies that overrun values for required client fields fail validation.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: CREATE Client with overrun required fields [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`,
            async () => {
                for (const field of Object.values(C_CLIENT.REQUIRED_COLUMNS)) {
                    const response = await request(app).post('/api/clients')
                        .send( buildTestClient( 'client', null, field ) );

                    const body = await assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
                    if (body.client_id !== undefined) {
                        clients.push(body.client_id);
                    }
                }
            });

        /**
         * Verifies that overrun values for optional client fields fail validation.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: CREATE Client with overrun optional fields [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`,
            async () => {
                for (const field of Object.values(C_CLIENT.MUTABLE_COLUMNS)) {
                    const response = await request(app).post('/api/clients')
                        .send( buildTestClient( 'client', null, field ) );

                    const body = await assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
                    if (body.client_id !== undefined) {
                        clients.push(body.client_id);
                    }
                }
            });
    });
    //-------------------------------------------------------------------------------------------------------------
    //       READ CLIENT TESTS
    //-------------------------------------------------------------------------------------------------------------

    /**
     * Tests client read behavior for pagination, ID lookup, full reads, invalid IDs, and search queries.
     */
    describe('[API]: READ client', () => {

        /**
         * Verifies that the default paginated client read returns HTTP 200.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: READ by default pagination [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            await assertEqualReturn(response, C_HTTP.STATUS.OK);
        });

        /**
         * Verifies that reading a client by a known valid ID returns HTTP 200.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST] READ by ID [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0]}`);
            await assertEqual( response, C_HTTP.STATUS.OK, );
        });

        /**
         * Verifies that requesting all clients returns HTTP 200.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST] READ all clients [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?all=true`);
            await assertEqual( response, C_HTTP.STATUS.OK, );
        })

        /**
         * Verifies that an invalid client ID returns HTTP 400.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST] READ invalid ID [EXPECTED] status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).get(`/api/clients/00000000-0000-0000-0000-000000`);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        /**
         * Verifies that searching by an existing client first name returns matching data.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: READ search string [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response1 = await request(app).get(`/api/clients/${clients[0]}`);
            const response2 = await request(app).get(`/api/clients?q=${response1.body.first_name}`);

            assert.equal(response2.statusCode, C_HTTP.STATUS.OK,)
            assert.ok(response2.body.data.length > 0, true,
                `Expected data to be non-empty, got ${response2.body.data.length} entries`);
        });

        /**
         * Verifies that a search query with no matches returns HTTP 200 and an empty data array.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: READ empty search [EXPECTED] status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
                const response = await request(app).get('/api/clients?q=spiderman');

                await assertEqual( response, C_HTTP.STATUS.OK,)
                assert.ok(response.body.data.length === 0, true,
                    `Expected data to be empty, got ${response.body.data.length} entries`);
            }
        );
    });
    //-------------------------------------------------------------------------------------------------------------
    //      UPDATE CLIENT TESTS
    //-------------------------------------------------------------------------------------------------------------

    /**
     * Tests client update behavior for valid field updates and validation failures.
     */
    describe('[API]: UPDATE client', () => {

        /**
         * Verifies that each supported client field can be updated successfully.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: update client fields [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const testcases = [
                {first_name: "TestClientUpdated"},
                {middle_name: "Updated"},
                {last_name: "Updated"},
                {title: "Updated"},
                {company_name: "Updated"},
                {email: `updated.${Date.now()}jobs@apple.com`},
                {phone_number: "1234567890"},
                {website: "https://updated.jobs"},
                {notes: "Updated"},
                {address_line1: "Updated"},
                {address_line2: "Updated"},
                {city: "Updated"},
                {state: "Updated"},
                {postal_code: "Updated"},
                {country: "Updated"},
                {billing_address_line1: "Updated"},
                {billing_address_line2: "Updated"},
                {billing_city: "Updated"},
                {billing_state: "Updated"},
                {billing_postal_code: "Updated"},
                {billing_country: "Updated"}
            ];
            for (const testcase of testcases) {
                const response = await request(app).patch(`/api/clients/${clients[0]}`).send(testcase);
                assertEqual(response, C_HTTP.STATUS.OK,);
            }
        });

        /**
         * Verifies that oversized update values fail validation with HTTP 400.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: Update with overrun data [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const testcases = {
                first_name: "C".repeat(C_CLIENT.MAX.FIRST_NAME + 1),
                middle_name: "T".repeat(C_CLIENT.MAX.MIDDLE_NAME + 1),
                last_name: "T".repeat(C_CLIENT.MAX.LAST_NAME + 1),
                title: "T".repeat(C_CLIENT.MAX.TITLE + 1),
                company_name: "S".repeat(C_CLIENT.MAX.COMPANY_NAME + 1),
                email: "c".repeat(C_CLIENT.MAX.EMAIL) + "@testsuite.com",
                phone_number: "8".repeat(C_CLIENT.MAX.PHONE + 1),
                websites: "https://".repeat(C_CLIENT.MAX.WEBSITE + 1),
                notes: "Notes".repeat(C_CLIENT.MAX.NOTES + 1),
                address_line1: "A".repeat(C_CLIENT.MAX.ADDRESS_LINE + 1),
                address_line2: "A".repeat(C_CLIENT.MAX.ADDRESS_LINE + 1),
                city: "C".repeat(C_CLIENT.MAX.CITY + 1),
                state: "S".repeat(C_CLIENT.MAX.STATE + 1),
                postal_code: "3".repeat(C_CLIENT.MAX.ZIP + 1),
                country: "C".repeat(C_CLIENT.MAX.COUNTRY + 1),
                billing_address_line1: "A".repeat(C_CLIENT.MAX.ADDRESS_LINE + 1),
                billing_address_line2: "A".repeat(C_CLIENT.MAX.ADDRESS_LINE + 1),
                billing_city: "C".repeat(C_CLIENT.MAX.CITY + 1),
                billing_state: "S".repeat(C_CLIENT.MAX.STATE + 1),
                billing_postal_code: "P".repeat(C_CLIENT.MAX.ZIP + 1),
                billing_country: "C".repeat(C_CLIENT.MAX.COUNTRY + 1)
            };
            for (const testcase in testcases) {
                const minMaxMap = C_CLIENT.MIN_MAX_MAPPING[testcase];

                console.log(`MAX Length: ${C_CLIENT.MAX[minMaxMap]}`);
                console.log(`Sending length: ${testcases[testcase].length} for ${testcase}`);

                const response = await request(app).patch(`/api/clients/${clients[0]}`)
                    .send(
                        {
                            [testcase]: testcases[testcase]
                        }
                    );
                assertEqual(response, C_HTTP.STATUS.BAD_REQUEST,)
            }
        });
    });
    //-------------------------------------------------------------------------------------------------------------
    //        DELETE CLIENT TESTS
    //-------------------------------------------------------------------------------------------------------------

    /**
     * Tests client delete behavior by removing a known test client.
     */
    describe('[API]: DELETE client', () => {

        /**
         * Verifies that deleting a client by ID returns HTTP 204 and removes the ID from cleanup tracking.
         *
         * @returns {Promise<void>}
         */
        test(`[TEST]: DELETE by ID [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/clients/${clients[0]}`);
            await assertEqual( response, C_HTTP.STATUS.NO_CONTENT );
            console.log(`Deleted Client with ID: ${clients[0]}`);
            clients.splice(0, 1);
        });
    });
});