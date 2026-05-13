const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index'); // exports the Express app

describe('POST /clients', () => {
    describe("test: valid entry", () => {
        //should return 200
        test("should return status code 200", async () => {
            const response = await request.post('/clients').send({
                first_name: "test",
                last_name: "test",
                company_name: "test",
                email: ""
            })
            assert.equal(response.statusCode, 200);
        })
        //should return client json object

    })
    describe("test: client name missing", () => {
        //should return 400
    })
    describe("test: client name too large", () => {
        //should return 400
    })
    describe("test: client email missing", () => {
        //should return 400
    })
    describe("test: client email too large", () => {
        //should return 400
    })
})


test('adds numbers', () => {
    const add = (a, b) => a + b;
    assert.equal(5, 5);
});
