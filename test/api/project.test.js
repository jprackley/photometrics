const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTPS = require('../../api/utils/httpStatus');
const C_HTTP = require("../../api/utils/httpStatus");

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

    //Creates Clients for the test suite.
    before(async () => {
        const test_clients = [
            {
                body: {
                    first_name: "Johnny",
                    last_name: "Projects",
                    company_name: "TestSuite",
                    email: `j.projects${Date.now()}@testsuite.com`,
                }
            },
            {
                body: {
                    first_name: "Susie",
                    last_name: "Projects",
                    company_name: "TestSuite",
                    email: `s.projects${Date.now()}@testsuite.com`,
                }
            },
            {
                body: {
                    first_name: "Wonka",
                    last_name: "Projects",
                    company_name: "TestSuite",
                    email: `w.projects${Date.now()}@testsuite.com`,
                }
            },
            {
                body: {
                    first_name: "Luis",
                    last_name: "Projects",
                    company_name: "TestSuite",
                    email: `l.projects${Date.now()}@testsuite.com`,
                }
            }
        ]
        for (client = 0; client < 4; client++) {
            const response = await request(app).post('/api/clients').send(test_clients[client].body);
            assert.equal(response.statusCode, C_HTTP.STATUS.CREATED,
                `Expected status code ${C_HTTP.STATUS.CREATED}, got ${response.statusCode}`);
            clients.push(response.body.client_id);
        }
    });
    //Creates a project for the test suite.
    before(async () => {
        const created = await request(app).post('/api/projects').send({
            project_name: 'Test Project',
            description: 'Created for UPDATE/DELETE test',
            client_id: clients[0],
            status: 'To-Do',
        });
        assert.equal(
            created.statusCode,
            C_HTTPS.STATUS.CREATED,
            `Expected status code ${C_HTTPS.STATUS.CREATED}, got ${created.statusCode}`
        );
        projects.push(created.body.project_id);
        assert.ok(projects.length > 0, 'No projects created');
    });

    //Deletes the project created in the before() function.
    after(async () => {
        for (const id of projects) {
            await request(app).delete(`/api/projects/${id}`);
        }
    });

    //Deletes the clients created in the before() function.
    after(async () => {
        for (const id of clients) {
            await request(app).delete(`/api/clients/${id}`);
        }
    });

    describe('[api]: CREATE projects', () => {

        test(`[test]: valid entry [expected]: status code ${C_HTTPS.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/projects').send({
                project_name: 'Test Project',
                description: 'This is a test project',
                client_id: clients[0],
                status: 'To-Do',
                start_time: '2023-01-01',
                due_time: '2023-12-31',
                completed_at: '2023-12-30',
            });
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.CREATED,
                `Expected status code ${C_HTTPS.STATUS.CREATED}, got ${response.statusCode}`
            );
            assert.ok(response.body.project_id);
            projects.push(response.body.project_id)
        });

    });

    describe('[api]: GET projects', () => {

        const invalid_queries = ['?page=-1', '?limit=-1', '?order=down'];

        test(`[test]: valid entry [expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/projects');
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.OK,
                `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
            );
        });

        test(`[test]: invalid query entry [expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
            for (const testcase of invalid_queries) {
                const response = await request(app).get(`/api/projects${testcase}`);
                assert.equal(
                    response.statusCode,
                    C_HTTPS.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, ${testcase} got ${response.statusCode}`
                );
            }
        });
    });

    describe('PATCH /api/projects/:id', () => {

        test(`[test]: valid entry [expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({
                    project_name: 'Updated Test Project',
                    description: 'This project was updated during an automated PATCH test.',
                    status: 'In Progress',
                });
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.OK,
                `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
            );
        });


        test('[test]: invalid entry [expected] status code 400', async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({});
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });

        test(`[[test]: invalid project_id [expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .patch('/api/projects/not-a-valid-uuid')
                .send({project_name: 'Invalid UUID Test'});
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });

        test(`[test]: project not found [expected] status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
            const missingProjectId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .patch(`/api/projects/${missingProjectId}`)
                .send({project_name: 'Missing Project Test'});
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.NOT_FOUND,
                `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
            );
            assert.equal(response.body.error.message, 'Project not found');
        });

        test(`[test]: invalid status [expected] status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app)
                .patch(`/api/projects/${projects[0]}`)
                .send({status: 'Invalid Status'});
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });
    });

    describe('DELETE /api/projects/:id', () => {

        test(`[test]: missing project [expected]: status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
            const missingProjectId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app).delete(`/api/projects/${missingProjectId}`);
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.NOT_FOUND,
                `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
            );
        });

        test(`[test]: invalid project id [expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).delete('/api/projects/not-a-valid-uuid');
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });


        test(`[test]: valid id [expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
            const deletedProjectId = projects[0];
            const response = await request(app).delete(`/api/projects/${projects[0]}`);
            assert.equal(
                response.statusCode,
                C_HTTPS.STATUS.OK,
                `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
            );
            assert.equal(response.body.project_id, deletedProjectId);
        });

    });
});
