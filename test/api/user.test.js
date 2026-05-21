const app = require('../../api/index')
const request = require('supertest');
const {describe, test, before, after} = require("node:test");

const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require("../../utils/constants/cUsers");

const { createTestUser } = require("../helpers/beforeTests");
const { buildTestUser } = require("../helpers/testBuilders");
const { assertEqual, assertEqualReturn } = require("../helpers/assertTests");
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

        test(`[TEST]: CREATE valid User [EXPECTED]: Status Code ${C_HTTP.STATUS.CREATED}`, async () => {

            const response = await request(app).post('/api/users').send( validUser );
            const body = assertEqualReturn(response, C_HTTP.STATUS.CREATED);
            if (body.user_id !== undefined) {
                users.push(body.user_id);
            }
        });

        test(`[TEST]: CREATE duplicate email [EXPECTED]: Status Code ${C_HTTP.STATUS.INTERNAL_SERVER_ERROR}`, async () => {

            const response = await request(app).post('/api/users').send( validUser );
            const body = assertEqualReturn(response, C_HTTP.STATUS.INTERNAL_SERVER_ERROR);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });

        test(`[TEST]: CREATE first name missing [EXPECTED]: Status Code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.FIRST_NAME));

            const body = assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });

        test(`[TEST]: CREATE last name missing [EXPECTED]: Status Code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.LAST_NAME,));

            const body = assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });

        test(`[TEST]: CREATE email missing [EXPECTED]: Status Code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.EMAIL,));

            const body = assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });

        test(`[TEST]: CREATE password missing [EXPECTED]: Status Code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.SECURE_COLUMNS.PASSWORD,));

            const body = assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });

        test(`[TEST]: CREATE role missing [EXPECTED]: Status Code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {

            const response = await request(app).post('/api/users')
                .send(buildTestUser(C_USER.ROLES.EMPLOYEE, 'users', C_USER.REQUIRED_COLUMNS.ROLE,));

            const body = assertEqualReturn(response, C_HTTP.STATUS.BAD_REQUEST);
            if ( body.user_id !== undefined ) {users.push(body.user_id);}
        });
        
    })
    /**
     * Tests the READ user endpoint.
     */
    describe('[API]: READ User', () => {

        test(`[TEST]: READ by default pagination [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {

            const response = await request(app).get('/api/users');
            assertEqual(response, C_HTTP.STATUS.OK);
        });

        test(`[TEST]: valid id [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {

            const response = await request(app).get(`/api/users/${users[0]}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
    })
    /**
     * Tests the UPDATE user endpoint.
     */
    describe('[API]: UPDATE User', () => {
        test(`[TEST]: UPDATE first name [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                first_name: "TestUserUpdated"
            });
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: UPDATE last name [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                last_name: "UserUpdated"
            })
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: UPDATE email [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                email: "whoops@update.com",
            })
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: UPDATE password [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                password_hash: "new password"
            })
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: UPDATE role [EXPECTED]: Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/users/${users[0]}`).send({
                account_role: "Employee"
            })
            assertEqual(response, C_HTTP.STATUS.OK);
        })
    })
    /**
     * Tests the DELETE user endpoint.
     */
    describe('[API]: DELETE User', () => {
        test(`[TEST]: DELETE user [EXPECTED]: Status Code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/users/${users[0]}`);
            assertEqual(response, C_HTTP.STATUS.NO_CONTENT);
            users.splice(0, 1);
        })
    })
});
