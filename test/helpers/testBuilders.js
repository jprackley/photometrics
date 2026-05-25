const C_USER = require("../../utils/constants/cUsers");
const C_CLIENT = require("../../utils/constants/cClients");
const C_PROJECT = require("../../utils/constants/cProjects");
const C_TASK = require("../../utils/constants/cTasks");

/**
 * Builds a User for test suites. Can define field to overrun or leave as an empty string.
 * @param {string} role
 * @param {string} testSuiteName
 * @param {string|null} [missingField]
 * @param {string|null} [overrunField]
 * @returns {Object} user
 **/
function buildTestUser( role, testSuiteName, missingField = null, overrunField = null ) {

    let user = {
        employee_id: "",
        manager_id: "",
        first_name: "TestUser",
        middle_name: "TestMiddleName",
        last_name: testSuiteName,
        display_name: "TestDisplayName",
        email: `test.user${Date.now()}@${testSuiteName}.testsuite.com`,
        password_hash: "password",
        account_role: role,
    };

    if (missingField !== null && overrunField !== null) {

        throw new Error("Build Test User: Missing and Overrund Fields cannot be used together.");

    } else if (Object.values(C_USER.REQUIRED_COLUMNS).includes(missingField)) {

        console.log("CREATED User Object with missing: ", missingField);
        user[missingField] = "";

    } else if (Object.values(C_USER.SECURE_COLUMNS).includes(missingField)) {

        console.log("CREATED User Object with missing: ", missingField);
        user[missingField] = "";

    } else if (Object.values(C_USER.REQUIRED_COLUMNS).includes(overrunField)) {

        if (overrunField === C_USER.REQUIRED_COLUMNS.EMAIL) {
            user[overrunField] = `t`.repeat(C_USER.MAX.EMAIL - 14).concat(`@testsuite.com`);
        } else {
            user[overrunField] = `t`.repeat(C_USER.MAX[overrunField]);
        }
        console.log("CREATED User Object with overrund: ", overrunField)
    }
    return user;
}
/**
 * Builds a Client for test suites. Can define field to overrun or leave as an empty string.
 *
 * @param {string} testSuiteName
 * @param {string|null} missingField
 * @param {string|null} overrunField
 * @returns {Object} client
 **/
function buildTestClient( testSuiteName,  missingField = null, overrunField = null ) {
    const emailPrefix = 't'
    const emailDomain = `@testsuite.com`

    let client = {
        first_name: "TestClient",
        middle_name: "TestMiddleName",
        last_name: testSuiteName,
        title: "TestTitle",
        company_name: "TestCompany",
        email: `test.user${Date.now()}@${testSuiteName}.testsuite.com`,
        phone_number: "1234567890",
        website: "test.website.com",
        notes: "TestNotes",

        address_line1: "123 Test Street",
        address_line2: "Apt 123",
        city: "TestCity",
        state: "TestState",
        postal_code: "12345",
        country: "TestCountry",

        billing_address_line1: "123 Test Street",
        billing_address_line2: "Apt 123",
        billing_city: "TestCity",
        billing_state: "TestState",
        billing_postal_code: "12345",
        billing_country: "TestCountry",
    };

    let minMaxKey = '';

    //Ensures the Client is not tested against a missing AND overrund field.
    if ( missingField !== null && overrunField !== null ) {

        throw new Error(`Build Test ${testSuiteName}: Missing and Overrund Fields cannot be used together.`);

    }
    //Logic for building Client with a missing field.
    if ( missingField !== null ) {
        //Catch to prevent sending an empty string to updated_at.
        if ( missingField === C_CLIENT.MUTABLE_COLUMNS.UPDATED_AT ) {
            console.log(`CREATED Test ${testSuiteName} \nClient: ${JSON.stringify(client, null, 2)}`)
            return client;
        }
        //Verify the missing field is in the required or mutable columns.
        else if ( Object.values(C_CLIENT.REQUIRED_COLUMNS).includes(missingField)
            || Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(missingField) ) {

            client[missingField] = "";
            console.log(`CREATED Test ${testSuiteName} Object with missing field: `, missingField,
                `\nClient: ${JSON.stringify(client, null, 2)}
            `);
        }
        return client;
    }
    else if ( overrunField !== null ) {
        //Verify the overrund field is in the required or mutable columns.
        if (Object.values(C_CLIENT.REQUIRED_COLUMNS).includes(overrunField)
            || Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(overrunField)) {

            // Maps the field name to the min/max length property name in the constant file.
            minMaxKey = C_CLIENT.MIN_MAX_MAPPING[overrunField];

            //If the overrund field is the email, then we need to create a valid email.
            if (overrunField === C_CLIENT.REQUIRED_COLUMNS.EMAIL) {
                client[overrunField] = emailPrefix.repeat(
                    (C_CLIENT.MAX.EMAIL - (emailDomain.length)) + 1
                ).concat(emailDomain);
            } else {
                client[overrunField] = `t`.repeat(C_CLIENT.MAX[minMaxKey] + 1);
            }
            console.log(`CREATED Test ${testSuiteName} Object with overrun: `, overrunField,
                `\nMAX Length: ${C_CLIENT.MAX[minMaxKey]}`,
                `\nGenerated Length: ${client[overrunField].length}`,
                `\nDATA: ${JSON.stringify(client, null, 2)}
            `);
        }
    } return client;
}

function buildTestProject( testSuiteName, manager, client) {

    try {
        return {
            client_id: client.client_id ? client.client_id : null,
            managed_by: manager.user_id ? manager.user_id : null,
            project_name: testSuiteName,
            description: testSuiteName,
            status: C_PROJECT.STATUS.TODO,
            priority: C_PROJECT.PRIORITY.NORMAL,
            notes: testSuiteName,
            start_time: new Date(Date.now()).toISOString(),
            shoot_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), //Adds 1 Week starts with ms
            due_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
            completed_at: null
        };
    } catch (error) {
        console.log(error);
    }
}

function buildTestTask (testSuiteName, project, manager, employee) {
    try {
        return {
            project_id: project.project_id,
            task_name: testSuiteName,
            category: C_TASK.CATEGORY.EDIT,
            priority: C_TASK.PRIORITY.NORMAL,
            description: testSuiteName,
            status: C_TASK.STATUS.TODO,
            progress: 0,
            start_time: null,
            stop_time: null,
            total_time: 0,
            due_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            completed_at: null,
            assigned_by: manager.user_id ? manager.user_id : null,
            assigned_to: employee.user_id ? employee.user_id : null,
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = {
    buildTestUser,
    buildTestClient,
    buildTestProject,
    buildTestTask,
};