const {test, describe, after, before} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTP = require('../../utils/constants/cHTTP');
const C = require('../../utils/constants/cSchema');

//Stores client IDs created during the test run.
let clients = [];
/**
 * Initial client used to create a known client before the test suite runs.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const initClient = [
    {
        body: {
            first_name: "Wilson",
            last_name: "Tester",
            company_name: "Testees",
            email: `wi.tester${Date.now()}@testees.com`,
        }
    }
]
/**
 * Valid client request body used to test successful client creation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const validClient = [
    {
        body: {
            first_name: "Johnny",
            last_name: "Tester",
            company_name: "Testees",
            email: `j.tester${Date.now()}@testees.com`,
        }
    }
]
/**
 * Invalid client request body used to test missing first name validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const missingFirstName = [
    {
        body: {
            first_name: "",
            last_name: "Lowe",
            company_name: "Testees",
            email: `s.lowe${Date.now()}@testees.com`,
        }
    }
]
/**
 * Invalid client request body used to test missing last name validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const missingLastName = [
    {
        body: {
            first_name: "Susan",
            last_name: "",
            company_name: "Testees",
            email: `s.lowe${Date.now()}@testees.com`,
        }
    }
]
/**
 * Invalid client request body used to test missing company name validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const missingCompName = [
    {
        body: {
            first_name: "Susan",
            last_name: "Lowe",
            company_name: "",
            email: `s.lowe${Date.now()}@testees.com`,
        }
    }
]
/**
 * Invalid client request body used to test missing email validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const missingEmail = [
    {
        body: {
            first_name: "Susan",
            last_name: "Lowe",
            company_name: "Testees",
            email: ``,
        }
    }
]
/**
 * Invalid client request body used to test first name max length validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const maxFirstName = [
    {
        body: {
            first_name: "C".repeat(C.MAX.FIRST_NAME_LENGTH + 1),
            last_name: "Taylor",
            company_name: "Slipknot",
            email: "c.taylor@testees.com"
        }
    }
]
/**
 * Invalid client request body used to test last name max length validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const maxLastName = [
    {
        body: {
            first_name: "Corey",
            last_name: "T".repeat(C.MAX.LAST_NAME_LENGTH + 1),
            company_name: "Slipknot",
            email: "c.taylor@testees.com"
        }
    }
]
/**
 * Invalid client request body used to test company name max length validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const maxCompName = [
    {
        body: {
            first_name: "Corey",
            last_name: "Taylor",
            company_name: "S".repeat(C.MAX.COMPANY_NAME_LENGTH + 1),
            email: "c.taylor@testees.com"
        }
    }
]
/**
 * Invalid client request body used to test email max length validation.
 *
 * @type {{body: {first_name: string, last_name: string, company_name: string, email: string}}[]}
 */
const maxEmail = [
    {
        body: {
            first_name: "Corey",
            last_name: "Taylor",
            company_name: "Slipknot",
            email: "c".repeat(C.MAX.EMAIL_LENGTH) + "@testees.com"
        }
    }
]
/**
 * Test suite for the `/api/clients` endpoint.
 *
 * This suite validates the main client API operations:
 * create, read, update, and delete.
 *
 * A client is created before the test suite runs so read, update,
 * and delete tests have a known valid client ID to use.
 *
 * Any clients created during the test run are stored in the `clients`
 * array so they can be removed during cleanup.
 */
describe('Testing /api/clients', () => {
    /**
     * Creates an initial client before the test suite runs.
     *
     * The created client ID is stored in the `clients` array and reused
     * by read, update, delete, and cleanup operations.
     *
     * @throws {AssertionError} If the API does not return HTTP 201 Created.
     */
    before(async () => {
        const response = await request(app).post('/api/clients').send(initClient[0].body);
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
        clients.push(response.body.client_id);
    })
    /**
     * Deletes all clients created during the test run.
     *
     * This prevents test records from remaining in the database after
     * the suite finishes.
     */
    after(async () => {
        for (const id of clients) {
            await request(app).delete(`/api/clients/${id}`);
        }
    });
    //------------------------------------//
    //         CREATE CLIENT TESTS        //
    //------------------------------------//
    describe('[api]: CREATE client', () => {
        /**
         * Verifies that a valid client can be created.
         *
         * @throws {AssertionError} If the API does not return HTTP 201 Created.
         */
        test(`[test]: CREATE valid entry [expected] status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/clients').send(validClient[0].body);
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
            clients.push(response.body.client_id);
        });
        /**
         * Verifies that client creation fails when first name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE first name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingFirstName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingFirstName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when first name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE max first name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxFirstName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxFirstName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when last name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE last name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingLastName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingLastName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when last name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE max last name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxLastName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxLastName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when company name is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE company name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingCompName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingCompName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when company name exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE max company name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxCompName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxCompName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when email is missing.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE email missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(missingEmail.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingEmail.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that client creation fails when email exceeds
         * the configured max length.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test]: CREATE max email [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxEmail.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxEmail.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
    });
    //------------------------------------//
    //       READ CLIENT TESTS            //
    //------------------------------------//
    /**
     * Tests client read behavior.
     *
     * This group validates default pagination, reading by ID,
     * invalid ID validation, valid search, and empty search results.
     */
    describe('[api]: READ client', () => {
        /**
         * Verifies that the clients endpoint returns a paginated response.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[test]: read by default pagination [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });
        /**
         * Verifies that a client can be retrieved by a valid client ID.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[test] valid id [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });
        /**
         * Verifies that an invalid client ID is rejected.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[test] invalid id [expected] status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).get(`/api/clients/00000000-0000-0000-0000-000000`);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
        /**
         * Verifies that a valid search query returns HTTP 200 OK and at least
         * one matching client.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK
         * or if the response data array is empty.
         */
        test(`[test]: valid search string [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?q=${validClient[0].body.first_name}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            assert.ok(response.body.data.length > 0, true,
                `Expected data to be non-empty, got ${response.body.data.length} entries`);
        });
        /**
         * Verifies that a search query with no matching clients returns
         * HTTP 200 OK and an empty data array.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK
         * or if the response data array is not empty.
         */
        test(`[test]: empty search [expected] status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
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
    describe('[api]: UPDATE client', () => {
        /**
         * Verifies that each editable client field can be updated.
         *
         * The test sends one PATCH request per field and expects each request
         * to return HTTP 200 OK.
         *
         * @throws {AssertionError} If any update request does not return
         * HTTP 200 OK.
         */
        test(`[test]: update client fields [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const testcases = [
                {
                    name: "first_name",
                    body: {first_name: "Steve"}
                },
                {
                    name: "last_name",
                    body: {last_name: "Jobs"}
                },
                {
                    name: "company_name",
                    body: {company_name: "Apple"}
                },
                {
                    name: "email",
                    body: {email: "s.jobs@apple.com"}
                }
            ];
            for (const testcase of testcases) {
                const response = await request(app).patch(`/api/clients/${clients[0]}`).send(testcase.body);
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `${testcase.name}: Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
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
        test(`[test]: invalid data length [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
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
    describe('[api]: DELETE client', () => {
        /**
         * Verifies that a client can be deleted by ID.
         *
         * @throws {AssertionError} If the API does not return HTTP 204 No Content.
         */
        test(`[test]: DELETE by ID [expected]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/clients/${clients[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}`);
        });
    });
});


