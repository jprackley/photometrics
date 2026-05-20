const {after, before, describe, test} = require('node:test');
const request = require('supertest');
const assert = require('node:assert');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require('../../utils/constants/cUsers');
const C_IMAGE = require('../../utils/constants/cImages');
const app = require('../../api/index');
const {query} = require("../../api/db");

describe('[API] /api/images', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];
    const images = [];

    before(async () => {
        // Create Employee User
        const eUserSQL = `
        INSERT INTO users (first_name, last_name, email, password_hash, account_role) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING user_id
        `;
        const eUserParams = [
            'TestEmployee',
            'Employee',
            `test.employee${Date.now()}@image.suite.com`,
            'password',
            C_USER.ROLES.EMPLOYEE,
        ];
        const {rows: eUserRows} = await query(eUserSQL, eUserParams);
        if (eUserRows.length === 0) {
            throw new Error('Failed to insert test employee user');
        } else {
            users.push(eUserRows[0]);
        }
        // Create Manager User
        const mUserSQL = `
        INSERT INTO users (first_name, last_name, email, password_hash, account_role) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING user_id
        `;
        const mUserParams = [
            'TestManager',
            'Manager',
            `test.manager${Date.now()}@image.suite.com`,
            'password',
            C_USER.ROLES.MANAGER,
        ];
        const {rows: mUserRows} = await query(mUserSQL, mUserParams);
        if (mUserRows.length === 0) {
            throw new Error('Failed to insert test manager user');
        } else {
            users.push(mUserRows[0]);
        }
        // Create Client
        const eClientSQL = `
        INSERT INTO clients (first_name, last_name, company_name, email) 
        VALUES ($1, $2, $3, $4) 
        RETURNING client_id
        `;
        const eClientParams = [
            'TestClient',
            'Client',
            'Test Company',
            `test.client${Date.now()}@image.suite.com`,
        ];
        const {rows: eClientRows} = await query(eClientSQL, eClientParams);
        if (eClientRows.length === 0) {
            throw new Error('Failed to insert test client');
        } else {
            clients.push(eClientRows[0]);
        }
        // Create Project
        const eProjectSQL = `
        INSERT INTO projects (client_id, managed_by, project_name) 
        VALUES ($1, $2, $3) 
        RETURNING project_id
        `;
        const eProjectParams = [
            clients[0].client_id,
            users[1].user_id,
            `Test Project ${Date.now()}`,
        ];
        const {rows: eProjectRows} = await query(eProjectSQL, eProjectParams);
        if (eProjectRows.length === 0) {
            throw new Error('Failed to insert test project');
        } else {
            projects.push(eProjectRows[0]);
        }
        // Create Task
        const eTaskSQL = `
        INSERT INTO tasks (project_id, task_name) 
        VALUES ($1, $2) 
        RETURNING task_id
        `;
        const eTaskParams = [
            projects[0].project_id,
            `Test Task ${Date.now()}`,
        ];
        const { rows: eTaskRows } = await query(eTaskSQL, eTaskParams);
        if (eTaskRows.length === 0) {
            throw new Error('Failed to insert test task');
        } else {
            tasks.push(eTaskRows[0]);
        }
    });

    after(async () => {
        //Deletes Images
        console.log('[POST] Deleting Test Images...');
        if (images.length > 0) {
            for ( const image of images ) {
                const imageSQL = `
                    DELETE
                    FROM images
                    WHERE image_id = $1
                    RETURNING image_id;
                `;
                const { rows: imageRows } = await query(imageSQL, [images[0]]);
                if (imageRows.length === 0) {
                    throw new Error('Failed to delete test image');
                }
                images.splice(images.indexOf(images[0]), 1);
            }
        } else { console.log('No Images Deleted.'); }
        // Deletes Tasks
        console.log('[POST] Deleting Test Tasks...');
        if (tasks.length > 0) {
            for ( const task of tasks ) {
                const taskSQL = `
                    DELETE
                    FROM tasks
                    WHERE task_id = $1
                    RETURNING task_id;
                `;
                const { rows: taskRows } = await query(taskSQL, [task.task_id]);
                if (taskRows.length === 0) {
                    throw new Error('Failed to delete test task');
                }
                tasks.splice(tasks.indexOf(tasks[0]), 1);
            }
        } else { console.log('No Tasks Deleted.') }
        // Deletes Projects
        console.log('[POST] Deleting Test Projects...');
        if (projects.length > 0) {
            for ( const project of projects ) {
                const projectSQL = `
                    DELETE
                    FROM projects
                    WHERE project_id = $1
                    RETURNING project_id;
                `;
                const { rows: projectRows } = await query(projectSQL, [project.project_id]);
                if (projectRows.length === 0) {
                    throw new Error('Failed to delete test project');
                }
                projects.splice(projects.indexOf(projects[0]), 1);
            }
        } else { console.log('No projects Deleted.'); }
        // Deletes Clients
        console.log('[POST] Deleting Test Clients...');
        if (clients.length > 0) {
            for ( const client of clients ) {
                const clientSQL = `
                    DELETE
                    FROM clients
                    WHERE client_id = $1
                    RETURNING client_id;
                `;
                const { rows: clientRows } = await query(clientSQL, [client.client_id]);
                if (clientRows.length === 0) {
                    throw new Error('Failed to delete test client');
                }
                clients.splice(clients.indexOf(clients[0]), 1);
            }
        } else { console.log('No Clients Deleted.') }
        // Deletes Users
        console.log('[POST] Deleting Test Users...');
        if (users.length > 0) {
            for ( const user of users ) {
                const userSQL = `
                    DELETE
                    FROM users
                    WHERE user_id = $1
                    RETURNING user_id;
                `;
                const { rows: userRows } = await query(userSQL, [user.user_id]);
                if (userRows.length === 0) {
                    throw new Error('Failed to delete test user');
                }
                users.splice(users.indexOf(users[0]), 1);
            }
        } else { console.log('No Users Deleted.') }
    });

    describe('[API]: CREATE Image', () => {
        test(`[TEST] Create Image [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/images').send({
                project_id: projects[0].project_id,
                task_id: tasks[0].task_id,
                name: 'test_image_001.jpg',
                description: 'Test Image From Image API Test',
                url: 'https://example.com/test_image_001.jpg',
                status: C_IMAGE.STATUS.IN_PROGRESS,
            });

            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
            images.push(response.body.image_id);
        });
    });

    describe('[API]: READ Image', () => {
        test(`[TEST] Read Image [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images/${images[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/images');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Project [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images?project_id=${projects[0].project_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images?task_id=${tasks[0].task_id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Status [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images?status=${C_IMAGE.STATUS.IN_PROGRESS}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Search [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/images?q=test_image_001');
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
            assert.ok(response.body.data.length > 0,
                `Expected data to be non empty, got ${response.body.data.length} entries`);
        });
    });

    describe('[API]: UPDATE Image', () => {
        test(`[TEST] Update Image [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/images/${images[0]}`).send({
                name: 'test_image_001_updated.jpg',
                description: 'Updated Image From Image API Test',
                status: C_IMAGE.STATUS.COMPLETED,
                completed_at: new Date().toISOString(),
            });

            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });
    });

    describe('[API]: DELETE Image', () => {
        test(`[TEST] Delete Image [EXPECTED] Status Code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/images/${images[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
            images.splice(images.indexOf(images[0]), 1);
        });
    });
});
