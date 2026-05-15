const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const { pool, healthcheck } = require("../../api/db");
const C_HTTP = require('../../api/utils/httpStatus');
const C = require('../../api/utils/constants');

let clients = [];
let clientIds = [];

describe('POST /api/clients', () => {

    describe('[test]: database connection', () => {
        test('db healthcheck returns ok', async () => {
            const response = await healthcheck();
            assert.equal(response.ok, true, 'Database healthcheck failed');
        });
    });

    //------------------------------------//
    //         CREATE CLIENT TESTS        //
    //------------------------------------//
    describe('api: create client', () => {
        describe("[test]: valid entry", () => {
            test(`should return status code ${C_HTTP.STATUS.CREATED}`, async () => {
                const testcases = [
                    {
                        id: 1,
                        body: {
                            first_name: "Johnny",
                            last_name: "Tester",
                            company_name: "Testees",
                            email: "j.tester@testees.com",
                        }
                    },
                    {
                        id: 2,
                        body: {
                            first_name: "Susie",
                            last_name: "Tester",
                            company_name: "Testees",
                            email: "s.tester@testees.com",
                        }
                    },
                    {
                        id: 3,
                        body: {
                            first_name: "Wonka",
                            last_name: "Tester",
                            company_name: "Testees",
                            email: "w.tester@testees.com",
                        }
                    },
                    {
                        id: 4,
                        body: {
                            first_name: "Luis",
                            last_name: "Tester",
                            company_name: "Testees",
                            email: "l.tester@testees.com",
                        }
                    }
                ]
                for (const testcase of testcases) {
                    const response = await request(app).post('/api/clients').send(testcase.body);
                    assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                        `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
                }
            })
        })

        describe("[test]: required client field is missing", () => {
            test(`should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const testcases = [
                    {
                        name: "first_name is empty",
                        body: {
                            first_name: "",
                            last_name: "Lowe",
                            company_name: "Testees",
                            email: "s.lowe@testees.com",
                        }
                    },
                    {
                        name: "last_name is empty",
                        body: {
                            first_name: "Susan",
                            last_name: "",
                            company_name: "Testees",
                            email: "s.lowe@testees.com",
                        }
                    },
                    {
                        name: "compant_name is empty",
                        body: {
                            first_name: "Susan",
                            last_name: "",
                            company_name: "Testees",
                            email: "s.lowe@testees.com",
                        }
                    },
                    {
                        name: "email is empty",
                        body: {
                            first_name: "Susan",
                            last_name: "",
                            company_name: "Testees",
                            email: "s.lowe@testees.com",
                        }
                    },
                ];
                for (const testcase of testcases) {
                    const response = await request(app).post('/api/clients').send(testcase.body);
                    assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                        `${testcase.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
                }
            })
        })
        // This will test if the client's first_name, last_name, company_name, and email are all less than
        // the maximum length specified in the constants file.
        describe("[test]: client string size", () => {
            const testcases = [
                {
                    name: "first_name is longer than 100 characters",
                    body: {
                        first_name: "C".repeat(C.MAX.FIRST_NAME_LENGTH + 1),
                        last_name: "Taylor",
                        company_name: "Slipknot",
                        email: "c.taylor@testees.com"
                    }
                },
                {
                    name: "last_name is longer than 100 characters",
                    body: {
                        first_name: "Corey",
                        last_name: "T".repeat(C.MAX.LAST_NAME_LENGTH + 1),
                        company_name: "Slipknot",
                        email: "c.taylor@testees.com"
                    }
                },
                {
                    name: "company_name is longer than 255 characters",
                    body: {
                        first_name: "Corey",
                        last_name: "Taylor",
                        company_name: "S".repeat(C.MAX.COMPANY_NAME_LENGTH + 1),
                        email: "c.taylor@testees.com"
                    }
                },
                {
                    name: "email is longer than 255 characters",
                    body: {
                        first_name: "Corey",
                        last_name: "Taylor",
                        company_name: "Slipknot",
                        email: "c".repeat(C.MAX.EMAIL_LENGTH) + "@testees.com"
                    }
                }
            ];
            for (const testcase of testcases) {
                test(`should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                    const response = await request(app).post('/api/clients').send(testcase.body);
                    assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                        `${testcase.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
                })
            }
        })
    })

    //------------------------------------//
    //       READ CLIENT TESTS            //
    //------------------------------------//
    describe('api: read client', () => {
        describe("[test]: read by default pagination", () => {
            test(`should return status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app).get('/api/clients');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);

                //Stores the clients for later use
                clients = response.body.data;
                clientIds = clients.map(c => c.client_id).filter(Boolean);
            })
        })

        describe("[test]: read by ID", () => {
            test(`valid id: should return status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app).get(`/api/clients/${clientIds[0]}`);
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            })
            test(`invalid id: should return status code ${C_HTTP.STATUS.NOT_FOUND} or ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app).get(`/api/clients/00000000-0000-0000-0000-000000`);
                assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            })
        })

        describe("[test]: read by search", () => {
            test(`valid search: should return status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app).get('/api/clients?q=Johnny');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
                assert.ok(response.body.data.length > 0, true,
                    `Expected data to be non-empty, got ${response.body.data.length} entries`);

            })
            test(`empty search: should return status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
                const response = await request(app).get('/api/clients?q=spiderman');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
                assert.ok(response.body.data.length === 0, true,
                    `Expected data to be empty, got ${response.body.data.length} entries`);
                }
            )
        })


    })



    //------------------------------------//
    //      UPDATE CLIENT TESTS           //
    //------------------------------------//
    describe('api: update client', () => {
        test(`update client fields: should return status code ${C_HTTP.STATUS.OK}`, async () => {
            const testcases = [
                {
                    name: "first_name",
                    body: { first_name: "Steve" }
                },
                {
                    name: "last_name",
                    body: { last_name: "Jobs" }
                },
                {
                    name: "company_name",
                    body: { company_name: "Apple" }
                },
                {
                    name: "email",
                    body: { email: "s.jobs@apple.com" }
                }
            ];
            for (const testcase of testcases) {
                const response = await request(app).patch(`/api/clients/${clientIds[0]}`).send(testcase.body);
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `${testcase.name}: Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
            }
        })

        describe("[test]: UPDATE client fields with invalid data length", () => {
            test(`[expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
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
                    const response = await request(app).patch(`/api/clients/${clientIds[0]}`).send(testcase.body);
                    assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                        `${testcase.name}: Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
                }
            })
        })

    })

    //------------------------------------//
    //        DELETE CLIENT TESTS         //
    //------------------------------------//
    describe('[api]: DELETE client', () => {
        //Will delete all clients
        describe("[test]: DELETE by ID", () => {
            test(`[expected]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
                for (const id of clientIds) {
                    const response = await request(app).delete(`/api/clients/${id}`);
                    assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                        `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}`);
                }
            })
        })
    })

    //Closes the database connection
    after(async () => {
        await pool.end();
    });
})
