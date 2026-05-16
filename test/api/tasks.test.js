const app = require('../../api/index')
const {describe, test, before, after} = require("node:test");
const C_HTTP = require('../../utils/constants/cHTTP');
const C_SCHEMA = require('../../utils/constants/cSchema');
const assert = require("node:assert");
const request = require('supertest');

describe('Testing /api/tasks', () => {

    const users = [
        {
            user_id: "",
            first_name: "The",
            last_name: "Manager",
            email: `the.manager${Date.now()}@testees.com`,
            password_hash: "manager",
            account_role: C_SCHEMA.USER_ROLES[0],
        },
        {
            user_id: "",
            first_name: "The",
            last_name: "Employee",
            email: `the.employee${Date.now()}@testees.com`,
            password_hash: "employee",
            account_role: C_SCHEMA.USER_ROLES[1],
        }
    ]
    const clients = [
        {
            client_id: "",
            first_name: "The",
            last_name: "Client",
            company_name: "The Company",
            email: `the.client${Date.now()}@testees.com`,
        }
    ]
    const projects = [
        {
            project_id: "",
            client_id: clients[0].client_id,
            managed_by: users[0].user_id,
            project_name: "The Project",
            description: "The Project Description",
        }
    ]
    const tasks = [
        {
            task_id: "",
            project_id: "",
            task_name: "The Task",
            category: C_SCHEMA.TASK_CATEGORIES[0],
            description: "The Task Description",
            assigned_by: "",
            assigned_to: "",
        },
        {
            project_id: "",
            task_name: "The Updated Task",
            category: C_SCHEMA.TASK_CATEGORIES[2],
            status: C_SCHEMA.STATUS.TASK[2],
            due_time: '2027-05-16T14:30:00Z',
            completed_time: '2026-012-16T14:30:00Z',
            assigned_to: users[0].user_id,
            description: "The Task Description Has Been Updated",
        }
    ]
    before(async () => {
        const response = await request(app).post('/api/users').send(users[0]);
        users[0].user_id = response.body.user_id;

        const response2 = await request(app).post('/api/users').send(users[1]);
        users[1].user_id = response2.body.user_id;

        const response3 = await request(app).post('/api/clients').send(clients[0]);
        clients[0].client_id = response3.body.client_id;

        for (const project of projects) {
            project.managed_by = users[0].user_id;
            project.client_id = clients[0].client_id;
        }
        const response4 = await request(app).post('/api/projects').send(projects[0]);
        projects[0].project_id = response4.body.project_id;

        for (const task of tasks) {
            task.project_id = projects[0].project_id;
            task.project_id = projects[0].project_id;
            task.assigned_by = users[0].user_id;
            task.assigned_to = users[1].user_id;
        }

    })
    after(async () => {
        for ( const project of projects ) {
            const response = await request(app).delete(`api/projects/${project.project_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`)
        }
        for ( const client of clients ) {
            const response = await request(app).delete(`api/clients/${client.client_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`)
        }
        for ( const user of users ) {
            const response = await request(app).delete(`api/users/${users[user].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n ${JSON.stringify(response.body, null, 2)}`)
        }
    })
    describe('[api]: CREATE Task', () => {
        test(`[test]: CREATE task [expected]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/tasks').send(tasks[0]);
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} 
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[0], null, 2)}`)
            tasks[0].task_id = response.body.task_id;
        })
    })

    describe('[api]: READ Task', () => {
        test(`[test]: READ task by id [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks/${tasks[0].task_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`
            )
        })
        test(`[test]: READ task by project [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?project_id=${projects[0].project_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[test]: READ task by assigned_by [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_by=${users[0].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[test]: READ task by assigned_to [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_to=${users[1].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[test]: READ task by category [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?category=${C_SCHEMA.TASK_CATEGORIES[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test('[test]: READ task by status [expected]: status code 200', async () => {
            const response = await request(app).get(`/api/tasks?status=${tasks[0].status}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[0], null, 2)}`)
        })
    })
    describe('[api]: UPDATE Task', () => {
        test(`[test]: UPDATE task [expected]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/tasks/${tasks[0].task_id}`).send(tasks[1]);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} 
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[1], null, 2)}`)
        })
    })
    describe('[api]: DELETE Task', () => {
        test(`[test]: DELETE task [expected]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            for (const task of tasks) {
                if (task.task_id !== ( "" || null || undefined )) {
                    const response = await request(app).delete(`/api/tasks/${task.task_id}`);
                    assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                        `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} 
                        \n ${JSON.stringify(response.body, null, 2)}`)
                }
            }
        })
    })
})