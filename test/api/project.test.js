const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTP = require("../../utils/constants/cHTTP");

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
    let clients = [];
    let projects = [];
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
        const client = {
                first_name: "TestClient",
                last_name: "Projects",
                company_name: "TestSuite",
                email: `j.projects${Date.now()}@testsuite.com`,
        }
        const response = await request(app).post('/api/clients').send(client);
        assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
            `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} \n
                ${JSON.stringify(response.body, null, 2)}`);
        if (response.statusCode === C_HTTP.STATUS.CREATED) {
            clients.push(response.body.client_id);
        }
    });
    /**
     * Deletes all test projects created during the test run.
     *
     * This cleanup runs after all tests have completed.
     */
    after(async () => {
        for (const id of projects) {
            const response = await request(app).delete(`/api/projects/${id}`);
            if (response.statusCode === C_HTTP.STATUS.NO_CONTENT) {
                projects.splice(projects.indexOf(id), 1);
            }
        }
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
        test(`[TEST]: valid entry [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/projects').send({
                project_name: 'Test Project',
                description: 'FROM Project Test Suite',
                client_id: clients[0],
                status: 'To-Do',
                start_time: '2023-01-01',
                due_time: '2023-12-31',
                completed_at: '2023-12-30',
            });
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode} 
                ${JSON.stringify(response.body, null, 2)}`
            );
            assert.ok(response.body.project_id, `Response should include project_id, 
                got ${JSON.stringify(response.body, null, 2)}`);
            projects.push(response.body.project_id)
        });

    });
    /**
     * Tests the project read endpoint.
     */
    describe('[api]: GET projects', () => {

        const invalid_queries = ['?page=-1', '?limit=-1', '?order=down'];
        /**
         * Verifies that the project endpoint returns a valid project list.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST]: valid entry [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/projects');
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode} 
                ${JSON.stringify(response.body, null, 2)}
            `);
        });
        /**
         * Verifies that invalid query parameters return HTTP 400 Bad Request.
         *
         * @throws {AssertionError} If any invalid query does not return
         * HTTP 400 Bad Request.
         */
        test(`[TEST]: invalid query entry [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            for (const testcase of invalid_queries) {
                const response = await request(app).get(`/api/projects${testcase}`);
                assert.equal(
                    response.statusCode,
                    C_HTTP.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, ${testcase} got ${response.statusCode}
                    ${JSON.stringify(response.body, null, 2)}`
                );
            }
        });
    });
    /**
     * Tests the project update endpoint.
     */
    describe('PATCH /api/projects/:id', () => {
        /**
         * Verifies that an existing project can be updated with valid fields.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK.
         */
        test(`[TEST]: valid entry [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({
                    project_name: 'Updated Test Project',
                    description: 'FROM Projects PATCH test.',
                    status: 'In Progress',
                });
            assert.equal(
                response.statusCode, C_HTTP.STATUS.OK,
                `Expected status code ${C_HTTP.STATUS.OK}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });
        /**
         * Verifies that an empty PATCH body is rejected.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test('[TEST]: invalid entry [EXPECTED] status code 400', async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({});
            assert.equal(
                response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
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
            assert.equal(
                response.statusCode, C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
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
            assert.equal(
                response.statusCode, C_HTTP.STATUS.NOT_FOUND,
                `Expected status code ${C_HTTP.STATUS.NOT_FOUND}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
            assert.equal(response.body.error.message, `Project not found`,
                `Expected error message: Project not found, got ${response.body.error.message}`);
        });
        /**
         * Verifies that an invalid project status is rejected.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */

        test(`[TEST]: invalid status [EXPECTED] status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({status: 'Invalid Status'});
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
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
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.NOT_FOUND,
                `Expected status code ${C_HTTP.STATUS.NOT_FOUND}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });
        /**
         * Verifies that deleting an invalid project UUID returns
         * HTTP 400 Bad Request.
         *
         * @throws {AssertionError} If the API does not return HTTP 400 Bad Request.
         */
        test(`[TEST]: DELETE by invalid id [EXPECTED]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).delete('/api/projects/not-a-valid-uuid');
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTP.STATUS.BAD_REQUEST}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
        });
        /**
         * Verifies that an existing project can be deleted.
         *
         * @throws {AssertionError} If the API does not return HTTP 200 OK
         * or the deleted project ID does not match the requested project ID.
         */
        test(`[TEST]: DELETE by id [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/projects/${projects[0]}`);
            assert.equal(
                response.statusCode,
                C_HTTP.STATUS.NO_CONTENT,
                `Expected status code ${C_HTTP.STATUS.NO_CONTENT}, got ${response.statusCode}
                ${JSON.stringify(response.body, null, 2)}`
            );
            projects.splice(projects.indexOf(projects[0]), 1);
        });

    });
});
