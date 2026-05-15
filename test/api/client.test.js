const {test, describe, after, before} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTP = require('../../api/utils/httpStatus');
const C = require('../../api/utils/constants');

let clients = [];
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

describe('Testing /api/clients', () => {
    before(async () => {
        const response = await request(app).post('/api/clients').send(initClient[0].body);
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
        clients.push(response.body.client_id);
    })
    after(async () => {
        for (const id of clients) {
            const response = await request(app).delete(`/api/clients/${id}`);
        }
    });
    //------------------------------------//
    //         CREATE CLIENT TESTS        //
    //------------------------------------//
    describe('[api]: CREATE client', () => {

        test(`[test]: CREATE valid entry [expected] status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/clients').send(validClient[0].body);
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
            clients.push(response.body.client_id);
        });

        test(`[test]: CREATE first name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingFirstName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingFirstName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE max first name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxFirstName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxFirstName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE last name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingLastName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingLastName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE max last name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxLastName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxLastName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE company name missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingCompName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingCompName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE max company name [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxCompName.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxCompName.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE email missing [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/clients').send(missingEmail.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${missingEmail.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: CREATE max email [expected] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/clients').send(maxEmail.body);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `${maxEmail.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });
    });
    //------------------------------------//
    //       READ CLIENT TESTS            //
    //------------------------------------//
    describe('[api]: READ client', () => {
        test(`[test]: read by default pagination [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });

        test(`[test] valid id [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients/${clients[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
        });
        test(`[test] invalid id [expected] status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).get(`/api/clients/00000000-0000-0000-0000-000000`);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
        });

        test(`[test]: valid search string [expected] status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/clients?q=${validClient[0].body.first_name}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            assert.ok(response.body.data.length > 0, true,
                `Expected data to be non-empty, got ${response.body.data.length} entries`);

        });
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
    describe('[api]: UPDATE client', () => {
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
    describe('[api]: DELETE client', () => {
        test(`[test]: DELETE by ID [expected]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/clients/${clients[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}`);
        });
    });
});


