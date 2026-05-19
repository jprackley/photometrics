const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../api');
const { query } = require('../../api/db');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_AUTH = require("../../utils/constants/cAuth");
const C_USER = require("../../utils/constants/cUsers");

describe('Testing /api/login', () => {
    let testUserId;

    const testUser = {
        first_name: 'LoginSuite',
        last_name: 'Test',
        email: `login.test.user${Date.now()}@testsuite.com`,
        password_hash: 'TestPassword123!',
        account_role: C_USER.ROLES.EMPLOYEE,
    };

    before(async () => {
        await query(
            'DELETE FROM users WHERE email = $1',
            [testUser.email]
        );

        const hashedPassword = await bcrypt.hash(testUser.password_hash, C_AUTH.SALT_ROUNDS);

        const { rows } = await query(
            `
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password_hash,
                account_role
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id
            `,
            [
                testUser.first_name,
                testUser.last_name,
                testUser.email,
                hashedPassword,
                testUser.account_role,
            ]
        );
        testUserId = rows[0].user_id;
    });

    after(async () => {
        await query(
            'DELETE FROM users WHERE user_id = $1',
            [testUserId]
        )
    });

    describe('[API]: LOGIN user', () => {
        test(`[TEST] valid login [EXPECTED] return status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password_hash: testUser.password_hash,
                });
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );

            assert.equal(response.body.user.user_id, testUserId,
                `Expected user_id ${testUserId}, got ${response.body.user.user_id}`);
            assert.equal(response.body.user.first_name, testUser.first_name,
                `Expected first_name ${testUser.first_name}, got ${response.body.user.first_name}`);
            assert.equal(response.body.user.last_name, testUser.last_name,
                `Expected last_name ${testUser.last_name}, got ${response.body.user.last_name}`);
            assert.equal(response.body.user.email, testUser.email,
                `Expected email ${testUser.email}, got ${response.body.user.email}`);
            assert.equal(response.body.user.account_role, testUser.account_role,
                `Expected account_role ${testUser.account_role}, got ${response.body.user.account_role}`);

            assert.equal(response.body.user.password_hash, undefined,
                `Expected password_hash to be undefined, got ${response.body.user.password_hash}`);
        });

        /*test(`wrong password should return status code ${C_HTTP.STATUS.UNAUTHORIZED}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password_hash: 'WrongPassword123!',
                });

            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.UNAUTHORIZED,
                `Expected status code ${C_HTTP.STATUS.UNAUTHORIZED}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );

            assert.equal(response.body.error.code, 'Unauthorized');
            assert.equal(response.body.error.message, 'Invalid email or password');
        });

        test(`unknown email should return status code ${C_HTTP.STATUS.UNAUTHORIZED}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'unknown.user@example.com',
                    password_hash: testUser.password_hash,
                });

            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.UNAUTHORIZED,
                `Expected status code ${C_HTTP.STATUS.UNAUTHORIZED}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );

            assert.equal(response.body.error.code, 'Unauthorized');
            assert.equal(response.body.error.message, 'Invalid email or password');
        });

        test(`missing email should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    password_hash: testUser.password_hash,
                });

            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });

        test(`missing password should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                });

            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });

        test(`invalid email format should return status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'not-an-email',
                    password_hash: testUser.password_hash,
                });

            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });*/
    });
});