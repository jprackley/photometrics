const {after, before, describe, test} = require('node:test');
const request = require('supertest');
const assert = require('node:assert');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require('../../utils/constants/cUsers');
const C_IMAGE = require('../../utils/constants/cImages');

const app = require('../../api/index');
const {
    createTestUser,
    createTestClient,
    createTestProject,
    createTestTask} = require('../helpers/createTests')
const {
    deleteTestImages,
    deleteTestTasks,
    deleteTestProjects,
    deleteTestClients,
    deleteTestUsers} = require("../helpers/deleteTests");
const {buildTestImage} = require("../helpers/testBuilders");
const {
    assertEqual,
    assertEqualQuery} = require("../helpers/assertTests");

describe('[API] /api/images', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];
    const images = [];

    const testSuiteName = 'imageTestSuite';

    before(async () => {
        // Create Employee User
        const euser = await createTestUser( C_USER.ROLES.EMPLOYEE, testSuiteName );
        if ( euser ) { users.push(euser); }
        // Create Manager User
        const muser = await createTestUser( C_USER.ROLES.MANAGER, testSuiteName );
        if ( muser ) { users.push(muser); }
        // Create Client
        const client = await createTestClient( testSuiteName);
        if ( client ) { clients.push(client); }
        // Create Project
        const project = await createTestProject( testSuiteName, users[0], clients[0] );
        if ( project ) { projects.push(project); }
        // Create Task
        const task = await createTestTask( testSuiteName, project, users[0], users[1] );
        if ( task ) { tasks.push(task); }
    });

    after(async () => {
        //Deletes Images
        console.log('[POST] Deleting Test Images...');
        images.length = await deleteTestImages(images, testSuiteName);
        // Deletes Tasks
        console.log('[POST] Deleting Test Tasks...');
        tasks.length = await deleteTestTasks(tasks, testSuiteName);
        // Deletes Projects
        console.log('[POST] Deleting Test Projects...');
        projects.length = await deleteTestProjects(projects, testSuiteName);
        // Deletes Clients
        console.log('[POST] Deleting Test Clients...');
        clients.length = await deleteTestClients(clients, testSuiteName);
        // Deletes Users
        console.log('[POST] Deleting Test Users...');
        users.length = await deleteTestUsers(users, testSuiteName);

    });

    describe('[API]: CREATE Image', () => {
        test(`[TEST] Create Image [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {

            console.log(`Starting test CREATE Image...`);
            const response = await request(app).post('/api/images').send(buildTestImage(
                testSuiteName,
                projects[0],
                tasks[0]
            ));

            assertEqual(response, C_HTTP.STATUS.CREATED);
            images.push(response.body.images);
        });
    });

    describe('[API]: READ Image', () => {
        test(`[TEST] Read Image [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Image...`);
            const response = await request(app).get(`/api/images/${images[0].image_id}`);

            assertEqual(response, C_HTTP.STATUS.OK);
            assertEqualQuery(response.body.images.image_id, images[0].image_id);
        });

        test(`[TEST] Read Images [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Images...`);
            const response = await request(app).get('/api/images');

            assertEqual(response, C_HTTP.STATUS.OK);
        });

        test(`[TEST] Read Images by Project [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Images by Project...`);
            const response = await request(app).get(`/api/images?project_id=${projects[0].project_id}`);

            assertEqual(response, C_HTTP.STATUS.OK);
            assertEqualQuery(response.body.images[0].project_id, projects[0].project_id);
        });

        test(`[TEST] Read Images by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Images by Task...`);
            const response = await request(app).get(`/api/images?task_id=${tasks[0].task_id}`);

            assertEqual(response, C_HTTP.STATUS.OK);
            assertEqualQuery(response.body.images[0].task_id, tasks[0].task_id);
        });

        test(`[TEST] Read Images by Status [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Images by Status...`);
            const response = await request(app).get(`/api/images?status=${C_IMAGE.STATUS.IN_PROGRESS}`);

            assertEqual(response, C_HTTP.STATUS.OK);
            assertEqualQuery(response.body.images[0].status, C_IMAGE.STATUS.IN_PROGRESS);
        });

        test(`[TEST] Read Images by Search [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test READ Images by Search...`);
            const response = await request(app).get(`/api/images?q=${testSuiteName}`);

            assertEqual(response, C_HTTP.STATUS.OK);
            assert.ok(response.body.images.length > 0,
                `Expected data to be non empty, got ${response.body.images.length} entries`);
        });
    });

    describe('[API]: UPDATE Image', () => {
        test(`[TEST] Update Image [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {

            console.log(`Starting test UPDATE Image...`);
            const response = await request(app).patch(`/api/images/${images[0].image_id}`).send({
                name: 'test_image_001_updated.jpg',
                description: 'Updated Image From Image API Test',
                status: C_IMAGE.STATUS.COMPLETED,
                completed_at: new Date().toISOString(),
            });

            assertEqual(response, C_HTTP.STATUS.OK);
            assertEqualQuery(response.body.images.name, 'test_image_001_updated.jpg');
        });
    });

    describe('[API]: DELETE Image', () => {
        test(`[TEST] Delete Image [EXPECTED] Status Code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {

            console.log(`Starting test DELETE Image...`);
            const response = await request(app).delete(`/api/images/${images[0].image_id}`);

            assertEqual(response, C_HTTP.STATUS.NO_CONTENT);
            images.splice(0, 1);
        });
    });
});
