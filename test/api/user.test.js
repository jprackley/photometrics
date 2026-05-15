const app = require('../../api/index')
const {describe, test} = require("node:test");
const C_HTTP = require('../../api/utils/httpStatus');
const assert = require("node:assert");
const C = require('../../api/utils/constants');

describe('POST /api/users', () => {

    describe('[test]: CREATE User', () => {
        describe("[test]: valid entry", () => {
            test(`[expected]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
                const response = await request(app).post('/api/users').send({
                    first_name: "Johnny",
                    last_name: "Tester",
                    email: "j.tester@testees.com",
                    password_hash: "password",
                    account_role: C.USER_ROLES[0],
                });
                assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                    `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
            })
        })
    })


})