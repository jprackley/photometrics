const C_USER = require("../../utils/constants/cUsers");

function buildTestUser( role, testSuiteName, missingField = null, overrundField = null ) {

    let user = {
        first_name: "TestUser",
        last_name: testSuiteName,
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
            user[overrundField] = `t`.repeat(C_USER.MAX[overrundField] - 1);
        }
        console.log("CREATED User with overrund: ", overrundField)
    }
    return user;
}

module.exports = {buildTestUser};