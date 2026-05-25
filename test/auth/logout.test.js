const request = require('supertest');
const { describe, test, before, after } = require('node:test');

const app = require('../../api');
const {query} = require("../../api/db");
const { assertEqual } = require('../helpers/assertTests')

const C_USER = require("../../utils/constants/cUsers");
const C_HTTP = require("../../utils/constants/cHTTP");


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
        console.log(`[BEFORE] Successfully created user ${rows[0].user_id}`)
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
            }
            users.splice(users.indexOf(id), 1);
            console.log(`[AFTER] Successfully delete user ${id}`)
        }
    })
    describe('[API]: LOGOUT user', () => {
        test(`[TEST] valid logout [EXPECTED] return status code 200`, async () => {
            const response = await request(app).post(`/api/logout/${users[0]}`);
            assertEqual(response, C_HTTP.STATUS.OK)
        })
    })
})