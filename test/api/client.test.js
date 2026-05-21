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

const clients = []
/**
 * Test suite for the `/api/clients` endpoint.
 *
 * This suite validates the main client API operations:
 * create, read, update, and delete.
 *
 * A client is created before the test suite runs, so read, update,
 * and delete tests have a known valid client ID to fallback on.
 *
 * Any clients created during the test run are stored in the `clients`
 * array so they can be removed during cleanup.
 */
describe('Testing /api/clients', () => {
    before(async () => {

        console.log('[PRE] Creating Test Data...');
        const rows = await createTestClient(
            C_CLIENT.REQUIRED_COLUMNS,
            'client'
        );

        console.log(`Created test client with ID: ${rows.client_id}`);
        clients.push(rows.client_id);
    })
    /**
     * Deletes all clients created during the test run.
     *
     * This prevents test records from remaining in the database after
     * the suite finishes.
     */
    after(async () => {

        console.log('[POST] Destroying Test Data...');
        clients.length = await deleteTestClients(clients, 'clients');
    });
    //-----------------------------------------------------------------------------------------------
    //         CREATE CLIENT TESTS
    //-----------------------------------------------------------------------------------------------
    describe('[API]: CREATE client', () => {
        /**
         * Verifies that a valid client can be created.
         *
         * @throws {AssertionError} If the API does not return HTTP 201 Created.
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
    //------------------------------------//
    //       READ CLIENT TESTS            //
    //------------------------------------//
    /**
     * Tests client-read behavior.
     *
     * This group validates default pagination, reading by ID,
     * invalid ID validation, valid search, and empty search results.
     */
    describe('[API]: READ client', () => {
        /**
         * Verifies that the client's endpoint returns a paginated response.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST]: READ by default pagination [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            await assertEqualReturn(response, C_HTTP.STATUS.OK);
        });
        /**
         * Verifies that a client can be retrieved by a valid client ID.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST] READ by ID [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0]}`);
            await assertEqual( response, C_HTTP.STATUS.OK, );
        });
        /**
         * Verifies that all clients can be retrieved by setting all=true in the query string.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST] READ all clients [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?all=true`);
            await assertEqual( response, C_HTTP.STATUS.OK, );
        })
        /**
         * Verifies that an invalid client ID is rejected.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST] READ invalid ID [EXPECTED] status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).get(`/api/clients/00000000-0000-0000-0000-000000`);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that a valid search query returns HTTP 200 OK and at least
         * one matching client.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK,
         * or if the response data array is empty.
         */
        test(`[TEST]: READ search string [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response1 = await request(app).get(`/api/clients/${clients[0]}`);
            const response2 = await request(app).get(`/api/clients?q=${response1.body.first_name}`);

            assert.equal(response2.statusCode, C_HTTP.STATUS.OK,)
            assert.ok(response2.body.data.length > 0, true,
                `Expected data to be non-empty, got ${response2.body.data.length} entries`);
        });
        /**
         * Verifies that a search query with no matching clients returns
         * HTTP 200 OK and an empty data array.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK,
         * or if the response data array is not empty.
         */
        test(`[TEST]: READ empty search [EXPECTED] status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
                const response = await request(app).get('/api/clients?q=spiderman');

                await assertEqual( response, C_HTTP.STATUS.OK,)
                assert.ok(response.body.data.length === 0, true,
                    `Expected data to be empty, got ${response.body.data.length} entries`);
            }
        );
    });
//------------------------------------//
//      UPDATE CLIENT TESTS           //
//------------------------------------//
    /**
     * Tests client update behavior.
     *
     * This group validates successful field updates and validation errors
     * for oversized fields.
     */
    describe('[API]: UPDATE client', () => {
        /**
         * Verifies that each editable client field can be updated.
         *
         * The test sends one PATCH request per field and expects each request
         * to return HTTP 200 OK.
         *
         * @throws {AssertionError} If any update request does not return
         * HTTP 200 OK.
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
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            }
        });
        /**
         * Verifies that oversized update fields are rejected.
         *
         * The test sends one PATCH request per invalid field and expects
         * each request to return HTTP 400 Bad Request.
         *
         * @throws {AssertionError} If any invalid update request does not
         * return HTTP 400 Bad Request.
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
    //------------------------------------//
    //        DELETE CLIENT TESTS         //
    //------------------------------------//
    /**
     * Tests client delete behavior.
     */
    describe('[API]: DELETE client', () => {
        /**
         * Verifies that ID can delete a client.
         *
         * @throws {AssertionError} If the API does not return HTTP 204 No Content.
         */
        test(`[TEST]: DELETE by ID [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/clients/${clients[0]}`);
            await assertEqual( response, C_HTTP.STATUS.NO_CONTENT );
            console.log(`Deleted Client with ID: ${clients[0]}`);
            clients.splice(0, 1);
        });
    });
});


