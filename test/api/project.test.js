const {describe, test, before} = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require('../../api/index');
const C_HTTPS = require('../../api/utils/httpStatus');

describe('Testing /api/projects', () => {
    let projectId;
    describe('[api]: CREATE projects', () => {

        describe("[test]: valid entry", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.CREATED}`, async () => {
                const client_id = await request(app).get('/api/clients');
                const response = await request(app).post('/api/projects').send({
                    project_name: "Test Project",
                    description: "This is a test project",
                    client_id: client_id.body.data[0].client_id,
                    status: "To-Do",
                    start_time: "2023-01-01",
                    due_time: "2023-12-31",
                    completed_at: "2023-12-30",
                })
                assert.equal(client_id.statusCode, C_HTTPS.STATUS.OK,'client_id not found');
                assert.equal(response.statusCode, C_HTTPS.STATUS.CREATED,
                    `Expected status code ${C_HTTPS.STATUS.CREATED}, got ${response.statusCode}`);
            })
        })
    })


    describe('[api]: GET projects', () => {

        describe("[test]: valid entry", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
                const response = await request(app).get('/api/projects');
                assert.equal(response.statusCode, C_HTTPS.STATUS.OK,
                    `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`);
            })
        })

        describe("[test]: invalid query entry", () => {
            const testcases = [
                '?page=-1',
                '?limit=-1',
                '?order=down',
            ]
            test(`[expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
                for (const testcase of testcases) {
                    const response = await request(app).get(`/api/projects${testcase}`);
                    assert.equal(response.statusCode, C_HTTPS.STATUS.BAD_REQUEST,
                        `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, ${testcase} got ${response.statusCode}`);
                }
            })
        })
    })
    describe("PATCH /api/projects/:id", () => {

        describe("[test]: valid entry", () => {

            before(async () => {
                const response = await request(app).get('/api/projects');
                projectId = response.body.data[0].project_id;
            })

            test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
                const response = await request(app).patch(`/api/projects/${projectId}`).send({
                    project_name: "Updated Test Project",
                    description: "This project was updated during an automated PATCH test.",
                    status: "In Progress"
                });
                assert.equal(response.statusCode, C_HTTPS.STATUS.OK,
                    `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`);
            })
        })

        describe("[test]: invalid entry", () => {})
        test("[expected]status code 400", async () => {
            const response = await request(app).patch(`/api/projects/${projectId}`).send({});

            assert.equal(response.statusCode, C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });
        describe("[test]: invalid project_id", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {

                const response = await request(app).patch("/api/projects/not-a-valid-uuid")
                    .send({project_name: "Invalid UUID Test"});

                assert.equal(response.statusCode, C_HTTPS.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
                );
            });
        })

        describe("[test]: project not found", () => {})
        test(`[expected] status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
            const missingProjectId = "00000000-0000-0000-0000-000000000000";

            const response = await request(app).patch(`/api/projects/${missingProjectId}`)
                .send({project_name: "Missing Project Test"});

            assert.equal(response.statusCode, C_HTTPS.STATUS.NOT_FOUND,
                `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
            );

            assert.equal(response.body.error.message,"Project not found");
        });
        describe("[test]: invalid status", () => {})
        test(`[expected] status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
            const response = await request(app).patch(`/api/projects/${projectId}`)
                .send({status: "Invalid Status"});

            assert.equal(response.statusCode,C_HTTPS.STATUS.BAD_REQUEST,
                `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
            );
        });
    });
    describe("DELETE /api/projects/:id", () => {
        describe("[test]: valid id", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
                const response = await request(app).delete(`/api/projects/${projectId}`);

                assert.equal(response.statusCode, C_HTTPS.STATUS.OK,
                    `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
                );

                assert.equal(response.body.project_id, projectId);
                assert.equal(response.body.project_name, "Delete Test Project");
            });
        describe("[test]: missing project", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
                const missingProjectId = "00000000-0000-0000-0000-000000000000";

                const response = await request(app).delete(`/api/projects/${missingProjectId}`);

                assert.equal(response.statusCode,C_HTTPS.STATUS.NOT_FOUND,
                    `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
                );
                assert.equal(response.body.error.code, C_HTTPS.REASON.NOT_FOUND);
            });
        })
        describe("[test]: invalid project id", () => {})
            test(`[expected]: status code ${C_HTTP.STATUS.BAD_REQUEST}`, async () => {
                const response = await request(app).delete("/api/projects/not-a-valid-uuid");

                assert.equal(response.statusCode, C_HTTPS.STATUS.BAD_REQUEST,
                    `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
                );
            });
        });
    })
})