const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../api/index');
const C_HTTPS = require('../../api/utils/httpStatus');

describe('Testing /api/projects', () => {
  let clientId; // will be fetched once and reused

  before(async () => {
    const clients = await request(app).get('/api/clients');
    assert.equal(clients.statusCode, C_HTTPS.STATUS.OK, 'GET /api/clients failed');
    const first = clients.body?.data?.[0];
    assert.ok(first, 'No clients found. Seed the DB or create a client before running tests.');
    clientId = first.client_id;
  });

  describe('[api]: CREATE projects', () => {
    describe('[test]: valid entry', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.CREATED}`, async () => {
        const response = await request(app).post('/api/projects').send({
          project_name: 'Test Project',
          description: 'This is a test project',
          client_id: clientId,
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
      });
    });
  });

  describe('[api]: GET projects', () => {
    describe('[test]: valid entry', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
        const response = await request(app).get('/api/projects');
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.OK,
          `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
        );
      });
    });

    describe('[test]: invalid query entry', () => {
      const testcases = ['?page=-1', '?limit=-1', '?order=down'];
      test(`[expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
        for (const testcase of testcases) {
          const response = await request(app).get(`/api/projects${testcase}`);
          assert.equal(
            response.statusCode,
            C_HTTPS.STATUS.BAD_REQUEST,
            `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, ${testcase} got ${response.statusCode}`
          );
        }
      });
    });
  });

  describe('PATCH /api/projects/:id', () => {
    let patchProjectId;

    before(async () => {
      // create a dedicated project for PATCH tests
      const created = await request(app).post('/api/projects').send({
        project_name: 'PATCH Test Project',
        description: 'Created for PATCH tests',
        client_id: clientId,
        status: 'To-Do',
      });
      assert.equal(
        created.statusCode,
        C_HTTPS.STATUS.CREATED,
        `Expected status code ${C_HTTPS.STATUS.CREATED}, got ${created.statusCode}`
      );
      patchProjectId = created.body.project_id;
      assert.ok(patchProjectId);
    });

    describe('[test]: valid entry', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
        const response = await request(app)
          .patch(`/api/projects/${patchProjectId}`)
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
    });

    describe('[test]: invalid entry', () => {
      test('[expected] status code 400', async () => {
        const response = await request(app)
          .patch(`/api/projects/${patchProjectId}`)
          .send({});
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.BAD_REQUEST,
          `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
        );
      });
    });

    describe('[test]: invalid project_id', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
        const response = await request(app)
          .patch('/api/projects/not-a-valid-uuid')
          .send({ project_name: 'Invalid UUID Test' });
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.BAD_REQUEST,
          `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
        );
      });
    });

    describe('[test]: project not found', () => {
      test(`[expected] status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
        const missingProjectId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
          .patch(`/api/projects/${missingProjectId}`)
          .send({ project_name: 'Missing Project Test' });
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.NOT_FOUND,
          `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
        );
        assert.equal(response.body.error.message, 'Project not found');
      });
    });

    describe('[test]: invalid status', () => {
      test(`[expected] status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
        const response = await request(app)
          .patch(`/api/projects/${patchProjectId}`)
          .send({ status: 'Invalid Status' });
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.BAD_REQUEST,
          `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
        );
      });
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let deleteProjectId;

    before(async () => {
      // create a dedicated project for DELETE tests
      const created = await request(app).post('/api/projects').send({
        project_name: 'Delete Test Project',
        description: 'Created for DELETE test',
        client_id: clientId,
        status: 'To-Do',
      });
      assert.equal(
        created.statusCode,
        C_HTTPS.STATUS.CREATED,
        `Expected status code ${C_HTTPS.STATUS.CREATED}, got ${created.statusCode}`
      );
      deleteProjectId = created.body.project_id;
      assert.ok(deleteProjectId);
    });

    describe('[test]: valid id', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.OK}`, async () => {
        const response = await request(app).delete(`/api/projects/${deleteProjectId}`);
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.OK,
          `Expected status code ${C_HTTPS.STATUS.OK}, got ${response.statusCode}`
        );
        assert.equal(response.body.project_id, deleteProjectId);
      });
    });

    describe('[test]: missing project', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.NOT_FOUND}`, async () => {
        const missingProjectId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app).delete(`/api/projects/${missingProjectId}`);
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.NOT_FOUND,
          `Expected status code ${C_HTTPS.STATUS.NOT_FOUND}, got ${response.statusCode}`
        );
      });
    });

    describe('[test]: invalid project id', () => {
      test(`[expected]: status code ${C_HTTPS.STATUS.BAD_REQUEST}`, async () => {
        const response = await request(app).delete('/api/projects/not-a-valid-uuid');
        assert.equal(
          response.statusCode,
          C_HTTPS.STATUS.BAD_REQUEST,
          `Expected status code ${C_HTTPS.STATUS.BAD_REQUEST}, got ${response.statusCode}`
        );
      });
    });
  });
});
