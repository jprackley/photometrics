const app = require('../../api/index')
const {describe, test, before, after} = require("node:test");
const C_HTTP = require('../../api/utils/httpStatus');
const assert = require("node:assert");
const request = require('supertest');

describe('Testing /api/users', () => {
    const users = [];
    before(async () => {

        const response = await request(app).post('/api/users').send({
            first_name: "Testin",
            last_name: "Using",
            email: `t.user${Date.now()}@testees.com`,
            password_hash: "password",
            account_role: "Manager",
        });
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
    });
    after(async () => {});

    describe('[api]: CREATE User', () => {

            test(`[test]: CREATE valid entry [expected]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
                const response = await request(app).post('/api/users').send({
                    first_name: "Johnny",
                    last_name: "Tester",
                    email: `j.tester${Date.now()}@testees.com`,
                    password_hash: "password",
                    account_role: "Manager",
                });
                assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                    `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
            });

    });

    describe('[api]: READ User', () => {

    })


});