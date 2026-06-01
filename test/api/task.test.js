const {describe, test, before, after} = require("node:test");
const request = require('supertest');

const app = require('../../api/index')
const { createTestUser, createTestClient, createTestProject, createTestTask} = require('../helpers/createTests');
const { assertEqual } = require('../helpers/assertTests')
const C_TASK = require('../../utils/constants/cTasks');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_USER = require("../../utils/constants/cUsers");
const C_CLIENT = require("../../utils/constants/cClients");
const {deleteTestUsers, deleteTestClients, deleteTestProjects, deleteTestTasks} = require("../helpers/deleteTests");

describe('Testing /api/tasks', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];

    const testSuiteName = 'taskTestSuite';

    before(async () => {
        try {
            console.log('[PRE] Creating Test Data...');
            //----------------------------------------------------------------------------------
            // Create Employee User
            //----------------------------------------------------------------------------------
            const euser = await createTestUser(C_USER.ROLES.EMPLOYEE, testSuiteName)
            users.push(euser);

            //----------------------------------------------------------------------------------
            // Create Manager User
            //----------------------------------------------------------------------------------
            const muser = await createTestUser(C_USER.ROLES.MANAGER, testSuiteName);
            users.push(muser);

            //----------------------------------------------------------------------------------
            // Create Client
            //----------------------------------------------------------------------------------
            const client = await createTestClient(C_CLIENT.REQUIRED_COLUMNS, testSuiteName)
            clients.push(client);

            //----------------------------------------------------------------------------------
            // Create Project
            //----------------------------------------------------------------------------------
            const project = await createTestProject(testSuiteName, muser, client)
            projects.push(project);

            //----------------------------------------------------------------------------------
            // Create Task
            //----------------------------------------------------------------------------------
            const task = await createTestTask(testSuiteName, project, muser, euser);
            tasks.push(task);

        } catch (error) {
            console.error('[PRE] Failed to create test data:', error);
            throw error;
        }
    })

    after(async () => {
        try {
            console.log('[POST] Deleting Test Data...');
            //----------------------------------------------------------------------------------
            // Delete Tasks
            //----------------------------------------------------------------------------------
            tasks.length = await deleteTestTasks(tasks, testSuiteName);

            //----------------------------------------------------------------------------------
            // Delete Projects
            //----------------------------------------------------------------------------------
            projects.length = await deleteTestProjects(projects, testSuiteName);

            //----------------------------------------------------------------------------------
            // Delete Clients
            //----------------------------------------------------------------------------------
            clients.length = await deleteTestClients(clients, testSuiteName);

            //----------------------------------------------------------------------------------
            // Delete Users
            //----------------------------------------------------------------------------------
            users.length = await deleteTestUsers(users, testSuiteName);

        } catch (error) {
            console.error('[PRE] Failed to delete test data:', error);
            throw error;
        }
    })

    //----------------------------------------------------------------------------------
    // Test Cases for the POST Task API /api/tasks
    //----------------------------------------------------------------------------------
    describe('[API]: CREATE Task', () => {
        test(`[TEST]: CREATE task [EXPECTED]: status code ${C_HTTP.STATUS.CREATED}`, async () => {
            console.log(`Creating Task...`);
            const response = await request(app).post('/api/tasks').send(
                {
                    project_id: projects[0].project_id,
                    task_name: `Test Task ${Date.now()}`,
                    category: C_TASK.CATEGORY.IMPORT,
                    priority: C_TASK.PRIORITY.HIGH,
                    description: 'Test Description',
                    status: C_TASK.STATUS.COMPLETED,
                    progress: 100.00,
                    due_time: new Date().toISOString(),
                    estimated_hours: 2.00,
                    assigned_to: users[1].user_id,
                    assigned_by: users[0].user_id,
                }
            );
            assertEqual(response, C_HTTP.STATUS.CREATED);
            tasks.push(response.body);
        })
    })

    describe('[API]: READ Task', () => {
        test(`[TEST]: READ task by id [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks/${tasks[0].task_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: READ task by project [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?project_id=${projects[0].project_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: READ task by assigned_by [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_by=${users[0].user_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: READ task by assigned_to [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?assigned_to=${users[1].user_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test(`[TEST]: READ task by category [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/tasks?category=${tasks[0].category}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        test('[TEST]: READ task by status [EXPECTED]: status code 200', async () => {
            const response = await request(app).get(`/api/tasks?status=${tasks[0].status}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })
    })
    describe('[API]: UPDATE Task', () => {
        test(`[TEST]: UPDATE task [EXPECTED]: status code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/tasks/${tasks[0].task_id}`).send(
                {
                    project_id: projects[0].project_id,
                    task_name: `Updated Task ${Date.now()}`,
                    category: C_TASK.CATEGORY.IMPORT,
                    priority: C_TASK.PRIORITY.HIGH,
                    description: 'Updated Description',
                    status: C_TASK.STATUS.COMPLETED,
                    progress: 100.00,
                    due_date: new Date().toISOString(),
                    start_date: new Date().toISOString(),
                    assigned_to: users[1].user_id,
                    assigned_by: users[0].user_id,
                }
            );
            assertEqual(response, C_HTTP.STATUS.OK);
        })
    })
    describe('[API]: DELETE Task', () => {
        test(`[TEST]: DELETE task [EXPECTED]: status code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            for (const task of tasks) {
                if (task.task_id) {
                    const response = await request(app).delete(`/api/tasks/${task.task_id}`);
                    assertEqual(response, C_HTTP.STATUS.NO_CONTENT);
                }
            }
            tasks.length = 0;
        })
    })
})