const request = require('supertest');
const app = require('../../api');
const { describe, test, before, after } = require('node:test');
const {query} = require("../../api/db");
const C_USER = require("../../utils/constants/cUsers");
const assert = require("node:assert");

describe('Testing /api/logout', () => {

    let users = [];

    before(async () => {
        const sql = `
        INSERT INTO users (first_name, last_name, email, password_hash, account_role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id;
        `;
        const { rows } = await query(sql,
            ['TestUser',
                'LogOutSuite',
                `test.logout${Date.now()}@test.user.com`,
                'password', `${C_USER.ROLES.EMPLOYEE}`
            ]);
        if (rows.length === 0) {
            throw new Error('Failed to insert test user');
        }

        users.push(rows[0].user_id);
    })

    after( async () => {
        for (const id of users) {
            const sql = `
                DELETE FROM users
                WHERE user_id = $1
                RETURNING user_id;
            `;

            const { rows } = await query(sql, [id]);
            if (rows.length === 0) {
                throw new Error('Failed to delete test user');
            } users.splice(users.indexOf(id), 1);
        }
    })
    describe('[API]: LOGOUT user', () => {
        test(`[TEST] valid logout [EXPECTED] return status code 200`, async () => {
            console.log(users[0]);
            const response = await request(app).post(`/api/logout/${users[0]}`);
            assert.equal(response.statusCode, 200,
                `Expected status code 200, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}
                ${JSON.stringify(response.body.message, null, 2)}
                ${JSON.stringify(response.body.error, null, 2)}`)
        })
    })
})