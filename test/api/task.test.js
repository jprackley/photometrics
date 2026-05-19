const {describe, test, before, after} = require("node:test");
const assert = require("node:assert");
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../api/index')
const C_TASK = require('../../utils/constants/cTasks');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require("../../utils/constants/cUsers");
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../../api/db");

describe('Testing /api/tasks', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];

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

    //----------------------------------------------------------------------------------
    // Test Cases for the POST Task API /api/tasks
    //----------------------------------------------------------------------------------
    describe('[API]: CREATE Task', () => {
        test(`[TEST]: CREATE task [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            console.log(`Creating Task...`);
            const response = await request(app).post('/api/tasks').send(
                {
                    project_id: projects[0].project_id,
                    task_name: `Test Task ${Date.now()}`,
                }
            );
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} 
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[0], null, 2)}`)
            tasks[0].task_id = response.body.task_id;
        })
    })

    describe('[API]: READ Task', () => {
        test(`[TEST]: READ task by id [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks/${tasks[0].task_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`
            )
        })
        test(`[TEST]: READ task by project [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?project_id=${projects[0].project_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[TEST]: READ task by assigned_by [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_by=${users[0].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[TEST]: READ task by assigned_to [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_to=${users[1].user_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK, `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test(`[TEST]: READ task by category [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?category=${tasks[0].category}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}`)
        })
        test('[TEST]: READ task by status [EXPECTED]: status code 200', async () => {
            const response = await request(app).get(`/api/tasks?status=${tasks[0].status}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[0], null, 2)}`)
        })
    })
    describe('[API]: UPDATE Task', () => {
        test(`[TEST]: UPDATE task [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/tasks/${tasks[0].task_id}`).send(
                {
                    project_id: projects[0].project_id,
                    task_name: `Updated Task ${Date.now()}`,
                    category: C_TASK.CATEGORY.IMPORT,
                    priority: C_TASK.PRIORITY.HIGH,
                    description: 'Updated Description',
                    status: C_TASK.STATUS.COMPLETED,
                    progress: 100.00,
                    due_date: new Date().toISOString(),
                    start_date: new Date().toISOString(),
                    assigned_to: users[1].user_id,
                    assigned_by: users[0].user_id,
                }
            );
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} 
                \n ${JSON.stringify(response.body, null, 2)} \n ${JSON.stringify(tasks[1], null, 2)}`)
        })
    })
    describe('[API]: DELETE Task', () => {
        test(`[TEST]: DELETE task [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            for (const task of tasks) {
                if (task.task_id) {
                    const response = await request(app).delete(`/api/tasks/${task.task_id}`);
                    assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                        `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} 
                        \n ${JSON.stringify(response.body, null, 2)}`)
                    tasks.splice(tasks.indexOf(tasks[0]), 1);
                }
            }
        })
    })
})