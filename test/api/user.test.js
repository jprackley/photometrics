const app = require('../../api/index')
const {describe, test, before, after, beforeEach} = require("node:test");
const C_HTTP = require('../../utils/constants/cHTTP');
const assert = require("node:assert");
const request = require('supertest');


/**
 * Test suite for the `/api/users` endpoint.
 *
 * This suite validates the main CRUD behavior for users:
 * CREATE, READ, update, and DELETE.
 *
 * A test user is created before the tests are run and removed after
 * the tests are complete. Any additional users created during the tests
 * are tracked in the `users` array so they can also be deleted.
 */
describe('Testing /api/users', () => {
    /**
     * Stores user IDs created during the test run.
     * Counter is used to generate unique email addresses.
     */
    const users = [];
    let validUser = {
        first_name: "TestUser",
        last_name: "UserTestSuite",
        email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    };

    const missingFirstName = {
        first_name: "",
        last_name: "User Test Suite",
        email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the last name is missing.
    const missingLastName = {
        first_name: "TestUser",
        last_name: "",
        email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the email is missing.
    const missingEmail = {
        first_name: "TestUser",
        last_name: "UserTestSuite",
        email: ``,
        password_hash: "password",
        account_role: "Manager",
    }
    //Request body used to test validation when the password is missing.
    const missingPassword = {
        first_name: "TestUser",
        last_name: "UserTestSuite",
        email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
        password_hash: "",
        account_role: "Manager",
    }
    //Request body used to test validation when the role is missing.
    const missingRole = {
        first_name: "TestUser",
        last_name: "UserTestSuite",
        email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
        password_hash: "password",
        account_role: "",
    }
    const duplicateEmail = {
        first_name: "TestUser",
        last_name: "UserTestSuite",
        email: `TestUser.UserTestSuite@testees.com`,
        password_hash: "password",
        account_role: "Manager",
    }
    /**
     * Creates a valid user before the test suite runs.
     *
     * The created user ID is stored in the `users` array, so later tests
     * can READ, UPDATE, and DELETE the same user.
     *
     * @throws {AssertionError} If the API does not return HTTP 201 Created.
     */
    beforeEach( () => {
        //Request body used to test validation when the first name is missing.
        validUser = {
            first_name: "TestUser",
            last_name: "UserTestSuite",
            email: `TestUser.UserTestSuite${Date.now()}@testees.com`,
            password_hash: "password",
            account_role: "Manager",
        }
    })
    before(async () => {

        const response = await request(app).post('/api/users').send(validUser);
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`);
        if (response.statusCode === C_HTTP.STATUS.CREATED) {
            users.push(response.body.user_id);
        }
    });
    /**
     * Creates a valid user before the test suite runs.
     *
     * The created user ID is stored in the `users` array, so later tests
     * can READ, UPDATE, and DELETE the same user.
     *
     * @throws {AssertionError} If the API does not return HTTP 201 Created.
     */
    after(async () => {
        for (const id of users) {
            await request(app).delete(`/api/users/${id}`);
        }
    });

    /**
     * Tests the CREATE user endpoint.
     *
     * Validates that a properly formed request creates a user and that
     * invalid request bodies return HTTP 400 Bad Request.
     */
    describe('[API]: CREATE User', () => {

        test(`[TEST]: CREATE valid User [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/users').send(validUser);
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE first name missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingFirstName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE last name missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingLastName);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE email missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingEmail);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE password missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingPassword);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST, `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE role missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).post('/api/users').send(missingRole);
            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST, `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE duplicate email [EXPECTED]: status code ${C_HTTP.STATUS.INTERNAL_SERVER_ERROR}`, async () => {

            const responseValid = await request(app).post('/api/users').send(duplicateEmail);
            assert.equal(responseValid.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${responseValid.statusCode} \n 
                ${JSON.stringify(responseValid.body, null, 2)}`);
            if (responseValid.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(responseValid.body.user_id);
            }

            const responseInvalid = await request(app).post('/api/users').send(duplicateEmail);
            assert.equal(responseInvalid.statusCode, C_HTTP.STATUS.INTERNAL_SERVER_ERROR,
                `Expected status code ${C_HTTP.STATUS.INTERNAL_SERVER_ERROR}, got ${responseInvalid.statusCode} \n 
                ${JSON.stringify(responseInvalid.body, null, 2)}`);
            if (responseInvalid.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(responseInvalid.body.user_id);
            }
        });
        
        
    })
    /**
     * Tests the READ user endpoint.
     *
     * Validates that users can be retrieved with default pagination and
     * that a specific user can be retrieved by ID.
     */
    describe('[API]: READ User', () => {

        test(`[TEST]: READ by default pagination [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/users');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST]: valid id [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/users/${users[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`);
        })
    })
    /**
     * Tests the UPDATE user endpoint.
     *
     * Validates that individual user fields can be updated using PATCH.
     */
    describe('[API]: UPDATE User', () => {
        test(`[TEST]: UPDATE first name [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                first_name: "TestUserUpdated"
            });
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST]: UPDATE last name [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                last_name: "UserUpdated"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST]: UPDATE email [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                email: "whoops@update.com",
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST]: UPDATE password [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                password_hash: "new password"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST]: UPDATE role [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                account_role: "Employee"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
    })
    /**
     * Tests the DELETE user endpoint.
     *
     * Validates that an existing user can be deleted and then removes
     * that user ID from the cleanup array.
     */
    describe('[API]: DELETE User', () => {
        test(`[TEST]: DELETE user [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/users/${users[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,)
            users.splice(0, 1);
        })
    })
});
