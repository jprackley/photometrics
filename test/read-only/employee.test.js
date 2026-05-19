const { describe, before, after, test } = require("node:test");
const assert = require("node:assert");
const request = require('supertest');

const app = require('../../api/index')
const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require("../../utils/constants/cUsers");
const {query} = require("../../api/db");
const {response} = require("express");

const users = [];

describe('Testing /api/employee', () => {
    before(async () => {
        const sql = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role) 
            VALUES (
                    'TestUser', 
                    'Employee', 
                    'test.user${Date.now()}@employee.suite.com', 
                    'password', 
                    '${C_USER.ROLES.EMPLOYEE}'
                   )
            RETURNING user_id;`;

        const { rows } = await query(sql);
        if (rows.length === 0) {
            throw new Error('Failed to insert test user');
        }
        users.push(rows[0].user_id);
    })

    after(async () => {
        for (const id of users) {
            const sql = `
                DELETE FROM users 
                WHERE user_id = $1
                RETURNING user_id;
            `;

            const { rows } = await query(sql, [id]);

            assert.equal(rows.length, 1, `Expected 1 row deleted, got ${rows.length} rows`);
        }
    })

    describe('[API]: READ Employee', () => {
        test(`[TEST] Read Employee [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/employees/${users[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        })

        test(`[TEST] Read Employees [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/employees');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
        })
    })
})