const app = require('../../api/index')
const assert = require("node:assert");
const request = require('supertest');
const {describe, test, before, after} = require("node:test");

const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require("../../utils/constants/cUsers");

const { createTestUser } = require("../helpers/beforeTests");
const { buildTestUser } = require("../helpers/testBuilders");
const { deleteTestUsers } = require("../helpers/afterTests");


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
    /**
     * Creates a valid user before the test suite runs.
     */
    before(async () => {

        console.log('[PRE] Creating Test Data...');

        const employee = await createTestUser(C_USER.ROLES.EMPLOYEE, 'users');
        users.push( employee.user_id );
        const manager = await createTestUser(C_USER.ROLES.MANAGER, 'users');
        users.push( manager.user_id );
    })
    /**
     * Removes users after the test suite runs.
     */
    after(async () => {

        console.log('[POST] Destroying Test Data...');

        users.length = await deleteTestUsers(users, 'users');
    })

    /**
     * Tests the CREATE user endpoint.
     */
    describe('[API]: CREATE User', () => {

        test(`[TEST]: CREATE valid User [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {

            const response = await request(app).post('/api/users')
                .send( buildTestUser(C_USER.ROLES.EMPLOYEE, 'users',) );

            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE first name missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.FIRST_NAME));

            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE last name missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.LAST_NAME,));

            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE email missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.EMAIL,));

            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE password missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.SECURE_COLUMNS.PASSWORD,));

            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST, `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE role missing [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.ROLE,));

            assert.equal(response.statusCode, C_HTTP.STATUS.BAD_REQUEST, `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
            if (response.statusCode === C_HTTP.STATUS.CREATED) {
                users.push(response.body.user_id);
            }
        });

        test(`[TEST]: CREATE duplicate email [EXPECTED]: status code ${C_HTTP.STATUS.INTERNAL_SERVER_ERROR}`, async () => {

            const response = await request(app).post('/api/users')
                .send( validUser );

            const responseInvalid = await request(app).post('/api/users')
                .send( validUser );

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
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST]: valid id [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {

            const response = await request(app).get(`/api/users/${users[0]}`);

            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`);
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
