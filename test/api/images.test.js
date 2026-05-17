const {after, before, describe, test} = require('node:test');
const request = require('supertest');
const assert = require('node:assert');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_SCHEMA = require('../../utils/constants/cSchema');
const app = require('../../api/index');

const users = [];
const clients = [];
const projects = [];
const tasks = [];
const images = [];
const MANAGER = 0;
const EMPLOYEE = 1;

describe('[API] /api/images', () => {
    before(async () => {
        const response = await request(app).post('/api/users').send({
            first_name: 'TestManager',
            last_name: 'Image',
            email: `i.manager${Date.now()}@testees.com`,
            password_hash: 'password',
            account_role: 'Manager',
        });
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n
            ${JSON.stringify(response.body, null, 2)}`);
        users.push(response.body.user_id);

        const response2 = await request(app).post('/api/users').send({
            first_name: 'TestEmployee',
            last_name: 'Image',
            email: `i.employee${Date.now()}@testees.com`,
            password_hash: 'password',
            account_role: 'Employee',
        });
        assert.equal(response2.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response2.statusCode} \n
            ${JSON.stringify(response2.body, null, 2)}`);
        users.push(response2.body.user_id);

        const response3 = await request(app).post('/api/clients').send({
            first_name: 'TestClient',
            last_name: 'Image',
            company_name: 'Test Image Company',
            email: `i.client${Date.now()}@testees.com`,
        });
        assert.equal(response3.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response3.statusCode} \n
            ${JSON.stringify(response3.body, null, 2)}`);
        clients.push(response3.body.client_id);

        const response4 = await request(app).post('/api/projects').send({
            client_id: clients[0],
            managed_by: users[MANAGER],
            project_name: 'Test Image Project',
            description: 'Test Project FROM Image',
        });
        assert.equal(response4.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response4.statusCode} \n
            ${JSON.stringify(response4.body, null, 2)}`);
        projects.push(response4.body.project_id);

        const response5 = await request(app).post('/api/tasks').send({
            project_id: projects[0],
            task_name: 'Test Image Task',
            category: C_SCHEMA.TASK_CATEGORIES[0],
            description: 'Test Task From Image',
            assigned_by: users[MANAGER],
            assigned_to: users[EMPLOYEE],
        });
        assert.equal(response5.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response5.statusCode} \n
            ${JSON.stringify(response5.body, null, 2)}`);
        tasks.push(response5.body.task_id);
    });

    after(async () => {
        for (const id of images) {
            const response = await request(app).delete(`/api/images/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        }

        for (const id of tasks) {
            const response = await request(app).delete(`/api/tasks/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        }

        for (const id of projects) {
            const response = await request(app).delete(`/api/projects/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        }

        for (const id of clients) {
            const response = await request(app).delete(`/api/clients/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        }

        for (const id of users) {
            const response = await request(app).delete(`/api/users/${id}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        }
    });

    describe('[API]: CREATE Image', () => {
        test(`[TEST] Create Image [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/images').send({
                project_id: projects[0],
                task_id: tasks[0],
                name: 'test_image_001.jpg',
                description: 'Test Image From Image API Test',
                url: 'https://example.com/test_image_001.jpg',
                status: C_SCHEMA.STATUS.IMAGE[0],
                completed: false,
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
            const response = await request(app).get(`/api/images?project_id=${projects[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images?task_id=${tasks[0]}`);
            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        });

        test(`[TEST] Read Images by Status [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/images?status=${encodeURIComponent(C_SCHEMA.STATUS.IMAGE[0])}`);
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
                status: C_SCHEMA.STATUS.IMAGE[1],
                completed: true,
            });

            assert.equal(response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
            assert.equal(response.body.completed, true,
                `Expected completed to be true, got ${response.body.completed}`);
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
