const app = require('../../api/index')
const {describe, test, before, after} = require("node:test");
const C_HTTP = require('../../api/utils/cHTTP');
const assert = require("node:assert");
const request = require('supertest');

describe('Testing /api/users', () => {
    const users = [];
    const missingFirstName = {
        first_name: "",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    const missingLastName = {
        first_name: "Johnny",
        last_name: "",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    const missingEmail = {
        first_name: "Johnny",
        last_name: "Tester",
        email: ``,
        password_hash: "password",
        account_role: "Manager",
    }
    const missingPassword = {
        first_name: "Johnny",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "",
        account_role: "Manager",
    }
    const missingRole = {
        first_name: "Johnny",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "",
    }
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
    after(async () => {
    });

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
            users.push(response.body.user_id);
        });

        test(`[test]: CREATE first name missing [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingFirstName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[test]: CREATE last name missing [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingLastName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[test]: CREATE email missing [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingEmail);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[test]: CREATE password missing [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingPassword);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,)
        });

        test(`[test]: CREATE role missing [expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingRole);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,)
        });

    });

    describe('[api]: READ User', () => {

    })


});