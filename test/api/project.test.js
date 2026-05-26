const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const C_HTTP = require("../../utils/constants/cHTTP");
const C_USER = require("../../utils/constants/cUsers");

const app = require('../../api/index');
const {
    createTestUser,
    createTestClient,
    createTestProject
} = require('../helpers/createTests');
const {
    deleteTestUsers,
    deleteTestClients,
    deleteTestProjects
} = require('../helpers/deleteTests');
const {buildTestProject} = require("../helpers/testBuilders");
const {assertEqual} = require("../helpers/assertTests");


describe('Testing /api/projects', () => {
    /*
    ** This test suite is designed to test the API endpoints related to projects.
    ** It uses the supertest library to make HTTP requests to the Express server.
    ** The test cases are designed to cover the following functionalities:
    ** - Creating a new project
    ** - Retrieving a list of projects
    ** - Updating an existing project
    ** - Deleting an existing project
    **
    ** The test suite first fetches a list of clients from the database.
    ** If no clients are found, then some will be created and seeded into the database.
    */
    const users = [];
    const clients = [];
    const projects = [];

    const testSuiteName = 'projectsTestSuite';

    /**
     * Creates temporary clients before the project test suite runs.
     *
     * Each project requires a valid `client_id`, so this setup block creates
     * four test clients and stores their IDs in the `clients` array.
     *
     * @throws {AssertionError} If any client creation request does not return
     * HTTP 201 Created.
     */
    before(async () => {
        // Creates a test user
        const muser = await createTestUser(C_USER.ROLES.MANAGER, testSuiteName);
        if (muser) {
            users.push(muser);
        }
        //Creates a test client
        const client = await createTestClient(testSuiteName);
        if (client) {
            clients.push(client);
        }
        //Creates a test project
        const project = await createTestProject(testSuiteName, users[0], clients[0]);
        if (project) {
            projects.push(project);
        }

    });
    /**
     * Deletes all test projects created during the test run.
     *
     * This cleanup runs after all tests have completed.
     */
    after(async () => {
        console.log('[POST] Cleaning up Projects test suite:');
        //Deletes all projects
        console.log('[POST] Deleting Test Projects...');
        projects.length = await deleteTestProjects(projects, testSuiteName);
        //Deletes all clients
        console.log('[POST] Deleting Test Clients...');
        clients.length = await deleteTestClients(clients, testSuiteName)
        //Deletes all users
        console.log('[POST] Deleting Test Users...');
        users.length = await deleteTestUsers(clients, testSuiteName);

    });
    /**
     * Tests the project creation endpoint.
     */
    describe('[api]: CREATE projects', () => {
        /**
         * Verifies that a valid project request creates a new project.
         *
         * @throws {AssertionError} If the API does not return HTTP 201 Created
         * or the response does not include a `project_id`.
         */
        test(`[TEST]: CREATE new Project [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/projects')
                .send(buildTestProject(testSuiteName, users[0], clients[0]));

            assertEqual(response, C_HTTP.STATUS.CREATED);
            assert.ok(response.body.projects.project_id, `Response should include project_id, 
                got ${JSON.stringify(response.body, null, 2)}`);

            if (response.body.projects) {
                projects.push(response.body.projects)
            }
        });

    });
    /**
     * Tests the project read endpoint.
     */
    describe('[api]: GET projects', () => {

        /**
         * Verifies that the project endpoint returns a valid project list.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST]: GET Projects [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/projects');

            assertEqual(response, C_HTTP.STATUS.OK);
        });

        test(`[TEST]: GET valid Projects query [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const valid_queries = {
                valid_limit: '?limit=10',
                valid_page: '?page=1',
                valid_order: '?order=desc',
                valid_status: '?status=To-Do',
                valid_client_id: `?client_id=${clients[0].client_id}`,
                valid_start_time: `?start_time=${projects[0].start_time}`,
                valid_project_name: `?project_name=${testSuiteName}`,
            }

            for (const query of Object.values(valid_queries)) {
                const response = await request(app).get(`/api/projects${query}`);

                assertEqual(response, C_HTTP.STATUS.OK);
            }
        })
        /**
         * Tests the project update endpoint.
         */
        describe('PATCH /api/projects/:id', () => {
            /**
             * Verifies that an existing project can be updated with valid fields.
             *
             * @throws {AssertionError} If the API does not return HTTP 200 OK.
             */
            test(`[TEST]: Patch Project [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
                const response = await request(app)
                    .patch(`/api/projects/${projects[0].project_id}`)
                    .send({
                        project_name: 'Updated Test Project',
                        description: 'FROM Projects PATCH test.',
                        status: 'In Progress',
                    });
                assertEqual(response, C_HTTP.STATUS.OK);
            });
            /**
             * Verifies that an empty PATCH body is rejected.
             *
             * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
             */
            test('[TEST]: invalid entry [EXPECTED] status code 400', async () => {
                const response = await request(app)
                    .patch(`/api/projects/${projects[0].project_id}`)
                    .send({});
                assertEqual(response, C_HTTP.STATUS.BAD_REQUEST);
            });
            /**
             * Verifies that an invalid project UUID is rejected.
             *
             * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
             */
            test(`[TEST]: invalid project_id [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app)
                    .patch('/api/projects/not-a-valid-uuid')
                    .send({project_name: '00000000-0000-0000-0000-0000000000000'});
                assertEqual(response, C_HTTP.STATUS.BAD_REQUEST);
            });
            /**
             * Verifies that updating a valid but missing project ID returns
             * HTTP 404 Not Found.
             *
             * @throws {AssertionError} If the API does not return HTTP 404 Not Found
             * or the expected error message.
             */
            test(`[TEST]: project not found [EXPECTED] status code ${C_HTTP.STATUS.NOT_FOUND}`, async () => {
                const missingProjectId = '00000000-0000-0000-0000-000000000000';
                const response = await request(app)
                    .patch(`/api/projects/${missingProjectId}`)
                    .send({project_name: 'Missing Project Test'});
                assertEqual(response, C_HTTP.STATUS.NOT_FOUND);
            });
            /**
             * Verifies that an invalid project status is rejected.
             *
             * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
             */

            test(`[TEST]: invalid status [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app)
                    .patch(`/api/projects/${projects[0].project_id}`)
                    .send({status: 'Invalid Status'});
                assertEqual(response, C_HTTP.STATUS.BAD_REQUEST);
            });
        });
        /**
         * Tests the project delete endpoint.
         */
        describe('DELETE /api/projects/:id', () => {
            /**
             * Verifies that deleting a valid but missing project ID returns
             * HTTP 404 Not Found.
             *
             * @throws {AssertionError} If the API does not return HTTP 404 Not Found.
             */
            test(`[TEST]: DELETE by missing id [EXPECTED]: status code ${C_HTTP.STATUS.NOT_FOUND}`, async () => {
                const missingProjectId = '00000000-0000-0000-0000-000000000000';
                const response = await request(app).delete(`/api/projects/${missingProjectId}`);
                assertEqual(response, C_HTTP.STATUS.NOT_FOUND);
            });
            /**
             * Verifies that deleting an invalid project UUID returns
             * HTTP 400 Bad Request.
             *
             * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
             */
            test(`[TEST]: DELETE by invalid id [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app).delete('/api/projects/not-a-valid-uuid');
                assertEqual(response, C_HTTP.STATUS.BAD_REQUEST);
            });
            /**
             * Verifies that an existing project can be deleted.
             *
             * @throws {AssertionError} If the API does not return HTTP 200 OK
             * or the deleted project ID does not match the requested project ID.
             */
            test(`[TEST]: DELETE by id [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
                const response = await request(app).delete(`/api/projects/${projects[0].project_id}`);
                assertEqual(response, C_HTTP.STATUS.NO_CONTENT);
                projects.splice(0, 1);
            });

        });
    });
});
