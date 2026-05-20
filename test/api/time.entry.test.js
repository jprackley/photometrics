const {after, before,  describe, test} = require("node:test");
const request = require('supertest');
const assert = require("node:assert");
const C_HTTP = require("../../utils/constants/cHTTP");
const app = require('../../api/index')
const bcrypt = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const C_USER = require("../../utils/constants/cUsers");
const {query} = require("../../api/db");

describe('[API] /api/time-entries', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];
    const timeEntries = [];

    before(async () => {
        console.log('[PRE] Creating Test Data...');
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, C_AUTH.SALT_ROUNDS);

        //----------------------------------------------------------------------------------
        // Create Employee User
        //----------------------------------------------------------------------------------
        const eUserSQL = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id;
        `;
        const eUserParam =
            [
                'TestUser',
                'Employee',
                `test.euser${Date.now()}@task.suite.com`,
                hashedPassword,
                C_USER.ROLES.EMPLOYEE
            ];
        const {rows: eUserRows} = await query(eUserSQL, eUserParam);
        if (eUserRows === 0) {
            throw new Error('Failed to insert test employee user');
        } else {
            users.push(eUserRows[0]);
            console.log('Test Employee User Created.');
        }

        //----------------------------------------------------------------------------------
        // Create Manager User
        //----------------------------------------------------------------------------------
        const mUserSQL = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id;
        `;
        const mUserParam =
            [
                'TestUser',
                'Manager',
                `test.muser${Date.now()}@task.suite.com`,
                hashedPassword,
                C_USER.ROLES.MANAGER
            ];
        const {rows: mUserRows} = await query(mUserSQL, mUserParam);
        if (mUserRows === 0) {
            throw new Error('Failed to insert test manager user');
        } else {
            users.push(mUserRows[0]);
            console.log('Test Manager User Created.');
        }

        //----------------------------------------------------------------------------------
        // Create Client
        //----------------------------------------------------------------------------------
        const clientSQL = `
            INSERT INTO clients (first_name, last_name, company_name, email)
            VALUES ($1, $2, $3, $4)
            RETURNING client_id;
        `;
        const clientParam =
            ['TestClient',
                'Company',
                'Test Company',
                `test.client${Date.now()}@task.suite.com`
            ];
        const {rows: clientRows} = await query(clientSQL, clientParam);
        if (clientRows === 0) {
            throw new Error('Failed to insert test client');
        } else {
            clients.push(clientRows[0]);
            console.log('Test Client Created.');
        }

        //----------------------------------------------------------------------------------
        // Create Project
        //----------------------------------------------------------------------------------
        const projectSQL = `
            INSERT INTO projects (client_id, managed_by, project_name)
            VALUES ($1, $2, $3)
            RETURNING project_id;
        `;
        const projectParam =
            [
                clients[0].client_id,
                users[1].user_id,
                `Test Project ${Date.now()}`
            ];
        const {rows: projectRows} = await query(projectSQL, projectParam);
        if (projectRows === 0) {
            throw new Error('Failed to insert test project');
        } else {
            projects.push(projectRows[0]);
            console.log('Test Project Created.');
        }

        //----------------------------------------------------------------------------------
        // Create Task
        //----------------------------------------------------------------------------------
        const taskSQL = `
            INSERT INTO tasks (project_id, task_name)
            VALUES ($1, $2)
            RETURNING task_id;
        `;
        const taskParam =
            [
                projects[0].project_id,
                `Test Task ${Date.now()}`
            ];
        const {rows: taskRows} = await query(taskSQL, taskParam);
        if (taskRows === 0) { throw new Error('Failed to insert test task'); }
        else {
            tasks.push(taskRows[0]);
            console.log('Test Task Created.');
        }
    })
    after(async () => {
        console.log('[POST] Deleting Test Data...');
        //----------------------------------------------------------------------------------
        // Delete Tasks
        //----------------------------------------------------------------------------------
        if (tasks.length > 0) {
            for (const task of tasks) {
                const taskSQL = `
                    DELETE
                    FROM tasks
                    WHERE task_id = $1
                    RETURNING task_id;
                `;
                const taskParam = [task.task_id];
                const {rows: taskRows} = await query(taskSQL, taskParam);
                if (taskRows.length === 0) { throw new Error('Failed to delete test task'); }
                tasks.splice(tasks.indexOf(task), 1);
            }
            console.log('Test Tasks Deleted.');
        } else {
            console.log('No Test Tasks Deleted.');
        }

        //----------------------------------------------------------------------------------
        // Delete Projects
        //----------------------------------------------------------------------------------
        if (projects.length > 0) {
            const projectSQL = `
                DELETE
                FROM projects
                WHERE project_id = $1
                RETURNING project_id;
            `;
            const projectParam = [projects[0].project_id];
            const {rows: projectRows} = await query(projectSQL, projectParam);
            if (projectRows.length === 0) { throw new Error('Failed to delete test project'); }
            projects.splice(projects.indexOf(projects[0]), 1);
            console.log('[POST] Test Project Deleted.');
        } else {
            console.log('No Test Projects Deleted.');
        }
        //----------------------------------------------------------------------------------
        // Delete Clients
        //----------------------------------------------------------------------------------
        if ( clients.length > 0) {
            const clientSQL = `
                DELETE
                FROM clients
                WHERE client_id = $1
                RETURNING client_id;
            `;
            const clientParam = [clients[0].client_id];
            const {rows: clientRows} = await query(clientSQL, clientParam);
            if (clientRows.length === 0) { throw new Error('Failed to delete test client'); }
            clients.splice(clients.indexOf(clients[0]), 1);
            console.log('Test Client Deleted.');
        } else {
            console.log('No Test Clients Deleted.');
        }
        //----------------------------------------------------------------------------------
        // Delete Users
        //----------------------------------------------------------------------------------
        if ( users.length > 0) {
            const userSQL = `
                DELETE
                FROM users
                WHERE user_id = $1
                RETURNING user_id;
            `;
            const userParam = [users[0].user_id];
            const {rows: userRows} = await query(userSQL, userParam);
            if (userRows.length === 0) { throw new Error('Failed to delete test user'); }
            users.splice(users.indexOf(users[0]), 1);
            console.log('Test User Deleted.');
        } else {
            console.log('No Test Users Deleted.');
        }
    })
    describe('[API]: CREATE Time Entry', () => {
        test(`[TEST] Create Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/time-entries').send({
                task_id: tasks[0].task_id,
                employee_id: users[0].user_id,
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
            const response = await request(app).get(`/api/time-entries?employee_id=${users[0].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
        })
        test(`[TEST] Read Time Entries by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries?task_id=${tasks[0].task_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,)
            }
        )
    })

    describe('[API]: UPDATE Time Entry', () => {
        test(`[TEST] Update Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/time-entries/${timeEntries[0]}`).send({
                task_id: tasks[0].task_id,
                employee_id: users[0].user_id,
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