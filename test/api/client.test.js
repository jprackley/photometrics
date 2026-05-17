const {test, describe, after, before} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTP = require('../../utils/constants/cHTTP');
const C = require('../../utils/constants/cSchema');


const clients = []
const clients_undefined = [
    {
        first_name: "",
        last_name: "Client",
        company_name: "Missing First Name",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    {
        first_name: "Client",
        last_name: "",
        company_name: "Missing Last Name",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    {
        first_name: "Missing Company Name",
        last_name: "Client",
        company_name: "",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    {
        first_name: "TestClient",
        last_name: "Client",
        company_name: "Missing Email",
        email: ``,
    }
]
const clients_overrun = [
    {
        first_name: "C".repeat(C.MAX.FIRST_NAME_LENGTH + 1),
        last_name: "Client",
        company_name: "First Name Too Long",
        email: "c.taylor@testees.com"
    },
    {
        first_name: "Client",
        last_name: "T".repeat(C.MAX.LAST_NAME_LENGTH + 1),
        company_name: "Last Name Too Long",
        email: "c.taylor@testees.com"
    },
    {
        first_name: "Max Company Name Length",
        last_name: "Client",
        company_name: "S".repeat(C.MAX.COMPANY_NAME_LENGTH + 1),
        email: "c.taylor@testees.com"
    },
    {
        first_name: "Corey",
        last_name: "Client",
        company_name: "Max Email Length",
        email: "c".repeat(C.MAX.EMAIL_LENGTH) + "@testees.com"
    }
]
/**
 * Test suite for the `/api/clients` endpoint.
 *
 * This suite validates the main client API operations:
 * create, read, update, and delete.
 *
 * A client is created before the test suite runs, so read, update,
 * and delete tests have a known valid client ID to use.
 *
 * Any clients created during the test run are stored in the `clients`
 * array so they can be removed during cleanup.
 */
describe('Testing /api/clients', () => {
    before(async () => {
        const response = await request(app).post('/api/clients').send(
            {
                first_name: "TestClient",
                last_name: "Client",
                company_name: "Valid Client",
                email: `before.tester${Date.now()}@testees.com`,
            },
        );
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
        if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
    })
    /**
     * Deletes all clients created during the test run.
     *
     * This prevents test records from remaining in the database after
     * the suite finishes.
     */
    after(async () => {
        for (const client of clients) {
            const response = await request(app).delete(`/api/clients/${client.client_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}`);
            clients.splice(clients.indexOf(client), 1);
        }
    });
    //------------------------------------//
    //         CREATE CLIENT TESTS        //
    //------------------------------------//
    describe('[API]: CREATE client', () => {
        /**
         * Verifies that a valid client can be created.
         *
         * @throws {AssertionError} If the API does not return HTTP 201 Created.
         */
        test(`[TEST]: CREATE valid entry [EXPECTED] status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/clients').send(
                {
                    first_name: "TestClient",
                    last_name: "Client",
                    company_name: "Valid Client",
                    email: `wi.tester${Date.now()}@testees.com`,
                },
            );
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the first name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE first name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined[0]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the first name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE max first name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun[0]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the last name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE last name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(clients_undefined[1]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the last name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE max last name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun[1]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the company name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE company name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(clients_undefined[2]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the company name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE max company name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun[2]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when email is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE email missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined[3]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the email exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE max email [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun[3]);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
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
        test(`[TEST]: read by default pagination [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });
        /**
         * Verifies that a client can be retrieved by a valid client ID.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST] valid id [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0].client_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });
        /**
         * Verifies that an invalid client ID is rejected.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST] invalid id [EXPECTED] status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
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
        test(`[TEST]: valid search string [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?q=${clients[0].first_name}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            assert.ok(response.body.data.length > 0, true,
                `Expected data to be non-empty, got ${response.body.data.length} entries`);
        });
        /**
         * Verifies that a search query with no matching clients returns
         * HTTP 200 OK and an empty data array.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK,
         * or if the response data array is not empty.
         */
        test(`[TEST]: empty search [EXPECTED] status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
                const response = await request(app).get('/api/clients?q=spiderman');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
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
                {last_name: "ClientUpdated"},
                {company_name: "Apple"},
                {email: `s.${Date.now()}jobs@apple.com`}];
            for (const testcase of testcases) {
                const response = await request(app).patch(`/api/clients/${clients[0].client_id}`).send(testcase);
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
        test(`[TEST]: invalid data length [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            let testcases;
            testcases = [
                {
                    name: "first_name is longer than 100 characters",
                    body: {
                        first_name: "C".repeat(C.MAX.FIRST_NAME_LENGTH + 1)
                    }
                },
                {
                    name: "last_name is longer than 100 characters",
                    body: {
                        last_name: "T".repeat(C.MAX.LAST_NAME_LENGTH + 1)
                    }
                },
                {
                    name: "company_name is longer than 255 characters",
                    body: {
                        company_name: "S".repeat(C.MAX.COMPANY_NAME_LENGTH + 1)
                    }
                },
                {
                    name: "email is longer than 255 characters",
                    body: {
                        email: "c".repeat(C.MAX.EMAIL_LENGTH) + "@testees.com"
                    }
                }
            ];
            for (const testcase of testcases) {
                const response = await request(app).patch(`/api/clients/${clients[0]}`).send(testcase.body);
                assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                    `${testcase.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
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
            for (const client of clients) {
                const response = await request(app).delete(`/api/clients/${client.client_id}`);
                assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                    `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}`);
                clients.splice(clients.indexOf(client), 1);
            }
        });
    });
});


