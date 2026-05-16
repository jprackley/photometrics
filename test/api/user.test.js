const app = require('../../api/index')
const {describe, test, before, after} = require("node:test");
const C_HTTP = require('../../utils/constants/cHTTP');
const assert = require("node:assert");
const request = require('supertest');


/**
 * Test suite for the `/api/users` endpoint.
 *
 * This suite validates the main CRUD behavior for users:
 * create, read, update, and delete.
 *
 * A test user is created before the tests run and removed after
 * the tests complete. Any additional users created during the tests
 * are tracked in the `users` array so they can also be deleted.
 */
describe('Testing /api/users', () => {
    /**
     * Stores user IDs created during the test run.
     */
    const users = [];
     //Request body used to test validation when the first name is missing.
    const missingFirstName = {
        first_name: "",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the last name is missing.
    const missingLastName = {
        first_name: "Johnny",
        last_name: "",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the email is missing.
    const missingEmail = {
        first_name: "Johnny",
        last_name: "Tester",
        email: ``,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the password is missing.
    const missingPassword = {
        first_name: "Johnny",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "",
        account_role: "Manager",
    }
    //Request body used to test validation when the role is missing.
    const missingRole = {
        first_name: "Johnny",
        last_name: "Tester",
        email: `j.tester${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "",
    }
    /**
     * Creates a valid user before the test suite runs.
     *
     * The created user ID is stored in the `users` array so later tests
     * can read, update, and delete the same user.
     *
     * @throws {AssertionError} If the API does not return HTTP 201 Created.
     */
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
        users.push(response.body.user_id);
    });
    /**
     * Creates a valid user before the test suite runs.
     *
     * The created user ID is stored in the `users` array so later tests
     * can read, update, and delete the same user.
     *
     * @throws {AssertionError} If the API does not return HTTP 201 Created.
     */
    after(async () => {
        for (const id of users) {
            await request(app).delete(`/api/users/${id}`);
        }
    });

    /**
     * Tests the create user endpoint.
     *
     * Validates that a properly formed request creates a user and that
     * invalid request bodies return HTTP 400 Bad Request.
     */
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
    /**
     * Tests the read user endpoint.
     *
     * Validates that users can be retrieved with default pagination and
     * that a specific user can be retrieved by ID.
     */
    describe('[api]: READ User', () => {

        test(`[test]: read by default pagination [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/users');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[test]: valid id [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/users/${users[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        })
    })
    /**
     * Tests the update user endpoint.
     *
     * Validates that individual user fields can be updated using PATCH.
     */
    describe('[api]: UPDATE User', () => {
        test(`[test]: UPDATE first name [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                first_name: "John"
            });
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[test]: UPDATE last name [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                last_name: "Teest"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[test]: UPDATE email [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                email: "whoops@update.com",
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[test]: UPDATE password [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                password_hash: "newpassword"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[test]: UPDATE role [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                account_role: "Employee"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
    })
    /**
     * Tests the delete user endpoint.
     *
     * Validates that an existing user can be deleted and then removes
     * that user ID from the cleanup array.
     */
    describe('[api]: DELETE User', () => {
        test(`[test]: DELETE user [expected]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/users/${users[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,)
            users.splice(0, 1);
        })
    })
});