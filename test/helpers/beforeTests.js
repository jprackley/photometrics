const bcrypt = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../../api/db");

async function createTestUser(role,testSuiteName) {
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, C_AUTH.SALT_ROUNDS);

    const userSQL = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id;
        `;
    const userParam =
        [
            'TestUser',
            `${role}`,
            `test.user${Date.now()}@${testSuiteName}.suite.com`,
            hashedPassword,
            role
        ];
    const { rows } = await query(userSQL, userParam);
    if ( rows === 0) {
        throw new Error(`Failed to INSERT Test ${role} User`);
    } else {
        console.log(`Test ${role} User Created.`);
        return rows[0];
    }
}

module.exports = {createTestUser};