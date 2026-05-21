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

        console.log("CREATED User Object with missing: ", missingField);
        user[missingField] = "";

    } else if ( Object.values(C_USER.SECURE_COLUMNS).includes(missingField) ) {

        console.log("CREATED User Object with missing: ", missingField);
        user[missingField] = "";

    } else if ( Object.values(C_USER.REQUIRED_COLUMNS).includes(overrundField)   ) {

        if ( overrundField === C_USER.REQUIRED_COLUMNS.EMAIL ) {
            user[overrundField] = `t`.repeat(C_USER.MAX.EMAIL - 14).concat(`@testsuite.com`);
        } else {
            user[overrundField] = `t`.repeat(C_USER.MAX[overrundField]);
        }
        console.log("CREATED User Object with overrund: ", overrundField)
    }
    return user;
}

function buildTestClient( testSuiteName,  missingField = null, overrundField = null ) {
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
    if ( missingField !== null && overrundField !== null ) {

        throw new Error(`Build Test ${testSuiteName}: Missing and Overrund Fields cannot be used together.`);

    } //Catch to prevent sending an empty string to updated_at.
    else if ( missingField === C_CLIENT.MUTABLE_COLUMNS.UPDATED_AT ) {
        console.log(`CREATED Test ${testSuiteName} \nDATA: ${JSON.stringify(client, null, 2)}`)
        return client;
    } //Verify the missing field is in the required or mutable columns.
    else if ( Object.values(C_CLIENT.REQUIRED_COLUMNS).includes(missingField)
        || Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(missingField) ) {

        client[missingField] = "";
        console.log(`CREATED Test ${testSuiteName} Object with missing field: `, missingField,
            `\nDATA: ${JSON.stringify(client, null, 2)}`)

    } //Verify the overrund field is in the required or mutable columns.
    else if ( Object.values(C_CLIENT.REQUIRED_COLUMNS).includes(overrundField)
        || Object.values(C_CLIENT.MUTABLE_COLUMNS).includes(overrundField) ) {

        // Maps the field name to the min/max length property name in the constant file.
        minMaxKey = C_CLIENT.MIN_MAX_MAPPING[overrundField];

        //If the overrund field is the email, then we need to create a valid email.
        if ( overrundField === C_CLIENT.REQUIRED_COLUMNS.EMAIL ) {
            client[overrundField] = emailPrefix.repeat(
                (C_CLIENT.MAX.EMAIL - (emailDomain.length)) +1
            ).concat(emailDomain);
        } else {
            client[overrundField] = `t`.repeat(C_CLIENT.MAX[minMaxKey] + 1);
        }
        console.log(`CREATED Test ${testSuiteName} Object with overrun: `, overrundField,
            `\nMAX Length: ${C_CLIENT.MAX[minMaxKey]}`,
            `\nGenerated Length: ${client[overrundField].length}`,
            `\nDATA: ${JSON.stringify(client, null, 2)}`)
    }
    return client;
}

module.exports = {buildTestUser, buildTestClient};