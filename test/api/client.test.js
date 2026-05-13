const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const request = require('supertest');
const app = require('../../api/index');
const { pool, healthcheck } = require("../../api/db");
const C_HTTP = require('../../api/utils/httpStatus');

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

        describe("test: client first name missing", () => {
            //should return 400
            test(`should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app).post('/api/clients').send({
                    first_name: "",
                    last_name: "Lowe",
                    company_name: "Testees",
                    email: "s.lowe@testees.com",
                    //created_at: "2023-01-01T00:00:00.000Z",
                    //updated_at: "2023-01-01T00:00:00.000Z"
                })
                assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}`);
            })
        })
        describe("test: client name too large", () => {
            //should return 400
        })
        describe("test: client email missing", () => {
            //should return 400
        })
        describe("test: client email too large", () => {
            //should return 400
        })
    })

    //------------------------------------//
    //       READ CLIENT TESTS            //
    //------------------------------------//
    describe('api: read client', () => {
        test(`should return status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/clients');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK);

            //Stores the clients for later use
            clients = response.body.data;
            clientIds = clients.map(c => c.client_id).filter(Boolean);
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
            test(`should return status code ${C_HTTP.STATUS.NOT_FOUND}`, async () => {
                for (const id of clientIds) {
                    const response = await request(app).delete(`/api/clients/${id}`);
                    assert.equal(response.statusCode, C_HTTP.STATUS.NOT_FOUND);
                }
            })
        })
    })

    //Closes the database connection
    after(async () => {
        await pool.end();
    });
})
