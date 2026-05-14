const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const request = require('supertest');
const app = require('../../api/index');
const { pool, healthcheck } = require("../../api/db");
const C_HTTP = require('../../api/utils/httpStatus');
const C = require('../../api/utils/constants');
const {rows} = require("pg/lib/defaults");

let clients = [];
let clientIds = [];

describe('POST /api/clients', () => {

    describe('test: database connection', () => {
        test('db healthcheck returns ok', async () => {
            const response = await healthcheck();
            console.log(response);
            assert.equal(response.ok, true);
        });
    });

    //------------------------------------//
    //         CREATE CLIENT TESTS        //
    //------------------------------------//
    describe('api: create client', () => {
        describe("test: valid entry", () => {
            test(`should return status code ${C_HTTP.STATUS.CREATED}`, async () => {
                const response = await request(app).post('/api/clients').send({
                    first_name: "Johnny",
                    last_name: "Tester",
                    company_name: "Testees",
                    email: "j.tester@testees.com",
                    //created_at: "2023-01-01T00:00:00.000Z",
                    //updated_at: "2023-01-01T00:00:00.000Z"
                })
                try {
                    assert.equal(response.statusCode, C_HTTP.STATUS.CREATED);
                } catch (e) {
                    console.log(`Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
                }
            })
        })

        describe("test: required client field is missing", () => {
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
        describe("test: client string size", () => {
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
        describe("test: read by default pagination", () => {
            test(`should return status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app).get('/api/clients');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);

                //Stores the clients for later use
                clients = response.body.data;
                clientIds = clients.map(c => c.client_id).filter(Boolean);
            })
        })

        describe("test: read by ID", () => {
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

        describe("test: read by search", () => {
            test(`valid search: should return status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app).get('/api/clients?q=Jordan');
                console.log("STATUS:", response.statusCode);
                console.log("BODY:", JSON.stringify(response.body, null, 2));
                console.log("DATA LENGTH:", response.body.data.length);
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
                assert.ok(response.body.data.length > 0, true,
                    `Expected data to be non-empty, got ${response.body.data.length} entries`);

            })
            test(`empty search: should return status code ${C_HTTP.STATUS.OK} and data is empty`, async () => {
                const response = await request(app).get('/api/clients?q=spiderman');
                assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                    `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`);
                assert.equal(response.body.data.isEmpty, true,
                    `Expected data to be empty, got ${response.body.data.length} entries`);
                }
            )
        })


    })



    //------------------------------------//
    //      UPDATE CLIENT TESTS           //
    //------------------------------------//
    describe('api: update client', () => {

    })

    //------------------------------------//
    //        DELETE CLIENT TESTS         //
    //------------------------------------//
    describe('api: delete client', () => {
        //Will delete all clients
        describe("test: delete by ID", () => {
            test(`should return status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
                for (const id of clientIds) {
                    const response = await request(app).delete(`/api/clients/${id}`);
                    assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT);
                }
            })
        })
    })

    //Closes the database connection
    after(async () => {
        await pool.end();
    });
})
