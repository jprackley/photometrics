const {describe, test} = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require('../../api/index');
const C_HTTPS = require('../../api/utils/httpStatus');

describe('GET /api/projects', () => {

    describe('[api]: CREATE projects', () => {

        describe("[test]: valid entry", () => {
            test(`[expected]: status code ${C_HTTPS.STATUS.CREATED}`, async () => {
                const client_id = await request(app).get('/api/clients');
                const response = await request(app).post('/api/projects').send({
                    name: "Test Project",
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

        describe(
        )
    })
})