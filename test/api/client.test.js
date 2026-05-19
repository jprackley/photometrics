const {test, describe, after, before} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_CLIENT = require('../../utils/constants/cClients');

const clients = []
const clients_undefined = {
    firstName: {
        first_name: "",
        last_name: "Client",
        company_name: "Missing First Name",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    lastName: {
        first_name: "Client",
        last_name: "",
        company_name: "Missing Last Name",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    companyName: {
        first_name: "Missing Company Name",
        last_name: "Client",
        company_name: "",
        email: `s.lowe${Date.now()}@testees.com`,
    },
    email: {
        first_name: "TestClient",
        last_name: "Client",
        company_name: "Missing Email",
        email: ``,
    }
}
const clients_overrun = {
    firstName: {
        first_name: "C".repeat(C_CLIENT.MAX_LENGTH.FIRST_NAME + 1),
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`
    },
    middleName: {
        first_name: "Client",
        middle_name: "T".repeat(C_CLIENT.MAX_LENGTH.MIDDLE_NAME + 1),
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`
    },
    lastName: {
        first_name: "Client",
        last_name: "T".repeat(C_CLIENT.MAX_LENGTH.LAST_NAME + 1),
        company_name: "Last Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`
    },
    title: {
        first_name: "Client",
        title: "T".repeat(C_CLIENT.MAX_LENGTH.TITLE + 1),
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`
    },
    companyName: {
        first_name: "Max Company Name Length",
        last_name: "Client",
        company_name: "S".repeat(C_CLIENT.MAX_LENGTH.COMPANY_NAME + 1),
        email: `s.lowe${Date.now()}@testees.com`
    },
    email: {
        first_name: "Corey",
        last_name: "Client",
        company_name: "Max Email Length",
        email: "c".repeat(C_CLIENT.MAX_LENGTH.EMAIL) + "@testees.com"
    },
    phoneNumber: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        phone_number: "9".repeat(C_CLIENT.MAX_LENGTH.PHONE + 1)
    },
    website: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        website: "https://".repeat(C_CLIENT.MAX_LENGTH.WEBSITE + 1) + ".com"
    },
    notes: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        notes: "N".repeat(C_CLIENT.MAX_LENGTH.NOTES + 1)
    },
    addressLine1: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        address_line1: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)
    },
    addressLine2: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        address_line2: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)
    },
    city: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        city: "C".repeat(C_CLIENT.MAX_LENGTH.CITY)
    },
    state: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        state: "C".repeat(C_CLIENT.MAX_LENGTH.STATE)
    },
    postalCode: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        postal_code: "9".repeat(C_CLIENT.MAX_LENGTH.ZIP)
    },
    country: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        country: "C".repeat(C_CLIENT.MAX_LENGTH.COUNTRY)
    },
    billingAddressLine1: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_address_line1: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)
    },
    billingAddressLine2: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_address_line2: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)
    },
    billingCity: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_city: "C".repeat(C_CLIENT.MAX_LENGTH.CITY)
    },
    billingState: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_state: "C".repeat(C_CLIENT.MAX_LENGTH.STATE)
    },
    billingPostalCode: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_postal_code: "9".repeat(C_CLIENT.MAX_LENGTH.ZIP)
    },
    billingCountry: {
        first_name: "Client",
        last_name: "Client",
        company_name: "First Name Too Long",
        email: `s.lowe${Date.now()}@testees.com`,
        billing_country: "C".repeat(C_CLIENT.MAX_LENGTH.COUNTRY)
    },

}
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
                middle_name: "Tester",
                last_name: "Client",
                title: "Mr.",

                company_name: "Valid Client",
                email: `before.tester${Date.now()}@testees.com`,
                phone_number: "555-555-5555",
                website: "https://testees.com",
                notes: "This is a test client.",

                address_line1: "123 Main St.",
                address_line2: "Suite 100",
                city: "Anytown",
                state: "CA",
                postal_code: "12345",
                country: "USA",

                billing_address_line1: "456 Elm St.",
                billing_address_line2: "Apt 100",
                billing_city: "Anytown",
                billing_state: "CA",
                billing_postal_code: "12345",
            },
        );
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n ${JSON.stringify(response.body)}`);
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
         * Verifies that client creation fails when the first name is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE first name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.firstName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });

        test(`[TEST]: CREATE max first name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.firstName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        /**
         * Verifies that client creation fails when the middle name is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test('[TEST]: CREATE missing middle name [EXPECTED] status code 201 Created', async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.middleName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test('[TEST]: CREATE max middle name [EXPECTED] status code 201 Created', async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.middleName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })

        /**
         * Verifies that client creation fails when the last name is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE last name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.lastName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max last name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.lastName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });

        /**
         * Verifies that client creation fails when the title is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE title missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.title);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max title [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.title);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST, `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })

        /**
         * Verifies that client creation fails when the company name is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE company name missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(clients_undefined.companyName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max company name [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.companyName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });

        /**
         * Verifies that client creation fails when an email is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE email missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.email);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max email [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.email);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });

        /**
         * Verifies that client creation fails when the phone number is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE phone number missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.phoneNumber);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max phone number [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.phoneNumber);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        })

        /**
         * Verifies that client creation fails when the website is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE website missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.website);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max website [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.website);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        })

        /**
         * Verifies that client creation fails when the notes are missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE notes missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.notes);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE max notes [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.notes);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        })

        /**
         * Verifies that client creation fails when the address is missing or overrun.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: CREATE address_line1 missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        });
        test(`[TEST]: CREATE address_line2 missing [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_undefined.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max address_line1 [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max address_line2 [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max city [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max state [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max postal_code [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })
        test(`[TEST]: CREATE max country [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(clients_overrun.address);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) clients.push(response.body);
        })

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
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });

        /**
         * Verifies that a client can be retrieved by a valid client ID.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST] READ by ID [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0].client_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });

        /**
         * Verifies that all clients can be retrieved by setting all=true in the query string.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST] READ all clients [EXPECTED] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?all=true`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
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
        test(`[TEST]: READ empty search [EXPECTED] status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
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
                { first_name: "C".repeat(C_CLIENT.MAX_LENGTH.FIRST_NAME + 1) },
                { middle_name: "T".repeat(C_CLIENT.MAX_LENGTH.MIDDLE_NAME + 1)},
                { last_name: "T".repeat(C_CLIENT.MAX_LENGTH.LAST_NAME + 1) },
                { title: "T".repeat(C_CLIENT.MAX_LENGTH.TITLE + 1) },
                { company_name: "S".repeat(C_CLIENT.MAX_LENGTH.COMPANY_NAME + 1) },
                { email: "c".repeat(C_CLIENT.MAX_LENGTH.EMAIL) + "@testees.com" },
                { phone_number: "8".repeat(C_CLIENT.MAX_LENGTH.PHONE_NUMBER) },
                { websites: "https://".repeat(C_CLIENT.MAX_LENGTH.WEBSITE + 1) },
                { notes: "Notes".repeat(C_CLIENT.MAX_LENGTH.NOTES + 1) },
                { address_line1: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)},
                { address_line2: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)},
                { city: "C".repeat(C_CLIENT.MAX_LENGTH.CITY) },
                { state: "S".repeat(C_CLIENT.MAX_LENGTH.STATE) },
                { postal_code: "P".repeat(C_CLIENT.MAX_LENGTH.POSTAL_CODE) },
                { country: "C".repeat(C_CLIENT.MAX_LENGTH.COUNTRY) },
                { billing_address_line1: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)},
                { billing_address_line2: "A".repeat(C_CLIENT.MAX_LENGTH.ADDRESS_LINE)},
                { billing_city: "C".repeat(C_CLIENT.MAX_LENGTH.CITY) },
                { billing_state: "S".repeat(C_CLIENT.MAX_LENGTH.STATE) },
                { billing_postal_code: "P".repeat(C_CLIENT.MAX_LENGTH.POSTAL_CODE) },
                { billing_country: "C".repeat(C_CLIENT.MAX_LENGTH.COUNTRY) }
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


