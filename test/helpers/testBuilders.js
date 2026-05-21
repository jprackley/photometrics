const C_USER = require("../../utils/constants/cUsers");
const C_CLIENT = require("../../utils/constants/cClients");

function buildTestUser( role, testSuiteName, missingField = null, overrundField = null ) {

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

    if ( missingField !== null && overrundField !== null ) {

        throw new Error("Build Test User: Missing and Overrund Fields cannot be used together.");

    } else if ( Object.values(C_USER.REQUIRED_COLUMNS).includes(missingField) ) {

        console.log("CREATED User with missing: ", missingField);
        user[missingField] = "";

    } else if ( Object.values(C_USER.SECURE_COLUMNS).includes(missingField) ) {

        console.log("CREATED User with missing: ", missingField);
        user[missingField] = "";

    } else if ( Object.values(C_USER.REQUIRED_COLUMNS).includes(overrundField)   ) {

        if ( overrundField === C_USER.REQUIRED_COLUMNS.EMAIL ) {
            user[overrundField] = `t`.repeat(C_USER.MAX.EMAIL - 14).concat(`@testsuite.com`);
        } else {
            user[overrundField] = `t`.repeat(C_USER.MAX[overrundField]);
        }
        console.log("CREATED User with overrund: ", overrundField)
    }
    return user;
}

function buildTestClient( testSuiteName,  missingField = null, overrundField = null ) {
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

        address_line_1: "123 Test Street",
        address_line_2: "Apt 123",
        city: "TestCity",
        state: "TestState",
        zip_code: "12345",
        country: "TestCountry",

        billing_address_line_1: "123 Test Street",
        billing_address_line_2: "Apt 123",
        billing_city: "TestCity",
        billing_state: "TestState",
        billing_zip_code: "12345",
        billing_country: "TestCountry",
    };
    //Ensures the Client is not tested against a missing AND overrund field.
    if ( missingField !== null && overrundField !== null ) {

        throw new Error(`Build Test ${testSuiteName}: Missing and Overrund Fields cannot be used together.`);

    } else if ( Object.values(C_CLIENT.REQUIRED_COLUMNS).includes(missingField) ) {

        console.log(`CREATED ${testSuiteName} with missing: `, missingField);
        client[missingField] = "";

    } else if ( Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(missingField) ) {

        console.log(`CREATED ${testSuiteName} with missing: `, missingField);
        client[missingField] = "";

    } else if ( Object.values(C_USER.REQUIRED_COLUMNS).includes(overrundField)   ) {

        if ( overrundField === C_USER.REQUIRED_COLUMNS.EMAIL ) {
            client[overrundField] = `t`.repeat(C_USER.MAX.EMAIL - 14).concat(`@testsuite.com`);
        } else {
            client[overrundField] = `t`.repeat(C_USER.MAX[overrundField]);
        }
        console.log(`CREATED ${testSuiteName} with overrund: `, overrundField)
    } else if ( Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(overrundField) ) {
        client[overrundField] = `t`.repeat(C_USER.MAX[overrundField]);
        console.log(`CREATED ${testSuiteName} with overrund: `, overrundField)
    }
    return client;
}

module.exports = {buildTestUser};