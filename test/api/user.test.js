const app = require('../../api/index')
const {describe, test, before, after} = require("node:test");
const C_HTTP = require('../../api/utils/httpStatus');
const assert = require("node:assert");
const C = require('../../api/utils/constants');
const request = require('supertest');

describe('POST /api/users', () => {

    before(async () => {});
    after(async () => {});

    describe('[test]: CREATE User', () => {

            test(`[test]: valid entry [expected]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
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


});