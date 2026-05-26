const {after, before,  describe, test} = require("node:test");
const request = require('supertest');

const C_HTTP = require("../../utils/constants/cHTTP");
const C_USER = require("../../utils/constants/cUsers");

const app = require('../../api/index')
const {
    createTestUser,
    createTestClient,
    createTestProject,
    createTestTask,
} = require("../../test/helpers/createTests");
const {
    deleteTestUsers,
    deleteTestClients,
    deleteTestProjects,
    deleteTestTasks,
    deleteTestTimeEntries
} = require("../../test/helpers/deleteTests");
const {buildTestTimeEntry} = require("../helpers/testBuilders");
const {assertEqual} = require("../helpers/assertTests");

describe('[API] /api/time-entries', () => {
    const users = [];
    const clients = [];
    const projects = [];
    const tasks = [];
    const timeEntries = [];

    const testSuiteName = "timeEntryTestSuite";

    before(async () => {
        console.log('[PRE] Creating Test Data...');
        //----------------------------------------------------------------------------------
        // Create Employee User
        //----------------------------------------------------------------------------------
        const euser = await createTestUser( C_USER.ROLES.EMPLOYEE, testSuiteName );
        if ( euser ) { users.push(euser); }
        //----------------------------------------------------------------------------------
        // Create Manager User
        //----------------------------------------------------------------------------------
        const muser = await createTestUser( C_USER.ROLES.MANAGER, testSuiteName );
        if ( muser ) { users.push(muser); }
        //----------------------------------------------------------------------------------
        // Create Client
        //----------------------------------------------------------------------------------
        const client = await createTestClient( testSuiteName );
        if ( client ) { clients.push(client); }
        //----------------------------------------------------------------------------------
        // Create Project
        //----------------------------------------------------------------------------------
        const project = await createTestProject( testSuiteName, users[1], clients[0] );
        if ( projects ) { projects.push(project); }
        //----------------------------------------------------------------------------------
        // Create Task
        //----------------------------------------------------------------------------------
        const task = await createTestTask( testSuiteName, projects[0], users[1], users[0] );
        if ( task ) { tasks.push(task); }
    })
    after(async () => {
        console.log('[POST] Deleting Test Data...');
        //----------------------------------------------------------------------------------
        // Delete Time Entries
        //----------------------------------------------------------------------------------
        console.log('[POST] Deleting Test Time Entries...');
        timeEntries.length = await deleteTestTimeEntries(timeEntries, testSuiteName);
        //----------------------------------------------------------------------------------
        // Delete Tasks
        //----------------------------------------------------------------------------------
        console.log('[POST] Deleting Test Tasks...');
        tasks.length = await deleteTestTasks(tasks, testSuiteName);
        //----------------------------------------------------------------------------------
        // Delete Projects
        //----------------------------------------------------------------------------------
        console.log('[POST] Deleting Test Projects...');
        projects.length = await deleteTestProjects(projects, testSuiteName);
        //----------------------------------------------------------------------------------
        // Delete Clients
        //----------------------------------------------------------------------------------
        console.log('[POST] Deleting Test Clients...');
        clients.length = await deleteTestClients(clients, testSuiteName);
        //----------------------------------------------------------------------------------
        // Delete Users
        //----------------------------------------------------------------------------------
        console.log('[POST] Deleting Test Users...');
        users.length = await deleteTestUsers(users, testSuiteName);
    })
    //-------------------------------------------------------------------------------------------------------------
    //       CREATE TIME ENTRY TESTS
    //-------------------------------------------------------------------------------------------------------------
    describe('[API]: CREATE Time Entry', () => {
        test(`[TEST] Create Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.CREATED}`, async () => {
            const response = await request(app).post('/api/time-entries')
                .send(buildTestTimeEntry(testSuiteName, tasks[0], users[0]));
            assertEqual(response, C_HTTP.STATUS.CREATED)
            if ( response.body.time_entries ) {
                timeEntries.push(response.body.time_entries);
            }
        })
    })
    //-------------------------------------------------------------------------------------------------------------
    //       READ TIME ENTRY TESTS
    //-------------------------------------------------------------------------------------------------------------
    describe('[API]: READ Time Entry', () => {
        test(`[TEST] Read Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries/${timeEntries[0].time_entry_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })

        test(`[TEST] Read Time Entries [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get('/api/time-entries');
            assertEqual(response, C_HTTP.STATUS.OK);
        })

        test(`[TEST] Read Time Entries by Employee [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries?employee_id=${users[0].user_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
        })

        test(`[TEST] Read Time Entries by Task [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).get(`/api/time-entries?task_id=${tasks[0].task_id}`);
            assertEqual(response, C_HTTP.STATUS.OK);
            }
        )
    })
    //-------------------------------------------------------------------------------------------------------------
    //       UPDATE TIME ENTRY TESTS
    //-------------------------------------------------------------------------------------------------------------
    describe('[API]: UPDATE Time Entry', () => {
        test(`[TEST] Update Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.OK}`, async () => {
            const response = await request(app).patch(`/api/time-entries/${timeEntries[0].time_entry_id}`)
                .send(buildTestTimeEntry(testSuiteName, tasks[0], users[0]));
            assertEqual(response, C_HTTP.STATUS.OK);
        })
        })
    //-------------------------------------------------------------------------------------------------------------
    //       DELETE TIME ENTRY TESTS
    //-------------------------------------------------------------------------------------------------------------
    describe('[API]: DELETE Time Entry', () => {
        test(`[TEST] Delete Time Entry [EXPECTED] Status Code ${C_HTTP.STATUS.NO_CONTENT}`, async () => {
            const response = await request(app).delete(`/api/time-entries/${timeEntries[0].time_entry_id}`);
            assertEqual(response, C_HTTP.STATUS.NO_CONTENT);
            timeEntries.splice(0, 1);
        })
    })
})