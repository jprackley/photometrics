const {after, before,  describe, test} = require("node:test");
const request = require('supertest');
const assert = require("node:assert");
const C_HTTP = require("../../utils/constants/cHTTP");
const C_SCHEMA = require("../../utils/constants/cSchema");
const app = require('../../api/index')

const users = [];
const clients = [];
const projects = [];
const tasks = [];
const timeEntries = [];
const MANAGER = 0;
const EMPLOYEE = 1;

describe('[API] /api/time-entries', () => {
    before(async () => {
        const response = await request(app).post('/api/users').send({
            first_name: "TestManager",
            last_name: "TimeEntry",
            email: `t.user${Date.now()}@testees.com`,
            password_hash: "password",
            account_role: "Manager",
        });
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n 
            ${JSON.stringify(response.body, null, 2)}`)
        users.push(response.body.user_id);

        const response2 = await request(app).post('/api/users').send({
            first_name: "TestEmployee",
            last_name: "TimeEntry",
            email: `t.employee${Date.now()}@testees.com`,
            password_hash: "password",
            account_role: "Employee",
        })
        assert.equal(response2.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response2.statusCode} \n 
            ${JSON.stringify(response2.body, null, 2)}`)
        users.push(response2.body.user_id);

        const response3 = await request(app).post('/api/clients').send({
            first_name: "TestClient",
            last_name: "TimeEntry",
            company_name: "Test Company",
            email: `t.client${Date.now()}@testees.com`,
        });
        assert.equal(response3.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response3.statusCode} \n 
            ${JSON.stringify(response3.body, null, 2)}`)
        clients.push(response3.body.client_id);

        const response4 = await request(app).post('/api/projects').send({
            client_id: clients[0],
            managed_by: users[MANAGER],
            project_name: "Test Project",
            description: "Test Project FROM Time Entry",
        })
        assert.equal(response4.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response4.statusCode} \n 
            ${JSON.stringify(response4.body, null, 2)}`)
        projects.push(response4.body.project_id);

        const response5 = await request(app).post('/api/tasks').send({
            project_id: projects[0],
            task_name: "Test Task",
            category: C_SCHEMA.TASK_CATEGORIES[0],
            description: "Test Task From Time Entry",
            assigned_by: users[MANAGER],
            assigned_to: users[EMPLOYEE],
        })
        assert.equal(response5.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response5.statusCode} \n 
            ${JSON.stringify(response5.body, null, 2)}`)
        tasks.push(response5.body.task_id);

    })
    after(async () => {
        for (const id of timeEntries) {
            const response = await request(app).delete(`/api/time-entries/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        }
        for (const id of tasks) {
            const response = await request(app).delete(`/api/tasks/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        }

        for (const id of projects) {
            const response = await request(app).delete(`/api/projects/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)} \n 
                ${JSON.stringify(request, null, 2)}`)
        }

        for (const id of clients) {
            const response = await request(app).delete(`/api/clients/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)} \n
                ${JSON.stringify(request, null, 2)}`)
        }

        for (const id of users) {
            const response = await request(app).delete(`/api/users/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        }
    })
    describe('[API]: CREATE Time Entry', () => {
        test(`[TEST] Create Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/time-entries').send({
                task_id: tasks[0],
                employee_id: users[EMPLOYEE],
                start_time: "2023-01-01T00:00:00.000Z",
                end_time: "2023-01-01T01:00:00.000Z",
                total_time: "60.00"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
            timeEntries.push(response.body.time_entry_id);
        })
    })

    describe('[API]: READ Time Entry', () => {
        test(`[TEST] Read Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries/${timeEntries[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        })
        test(`[TEST] Read Time Entries [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/time-entries');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        })
        test(`[TEST] Read Time Entries by Employee [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries?employee_id=${users[EMPLOYEE]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST] Read Time Entries by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries?task_id=${tasks[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
            }
        )
    })

    describe('[API]: UPDATE Time Entry', () => {
        test(`[TEST] Update Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/time-entries/${timeEntries[0]}`).send({
                task_id: tasks[0],
                employee_id: users[EMPLOYEE],
                start_time: "2023-01-01T00:00:00.000Z",
                end_time: "2023-01-01T01:00:00.000Z",
                total_time: "65.00"
            })
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
        })
        })
    describe('[API]: DELETE Time Entry', () => {
        test(`[TEST] Delete Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/time-entries/${timeEntries[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n 
                ${JSON.stringify(response.body, null, 2)}`)
            timeEntries.splice(timeEntries.indexOf(timeEntries[0]), 1);
        })
    })
})