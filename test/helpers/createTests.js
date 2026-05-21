const bcrypt = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../../api/db");
const { buildTestClient } = require("../helpers/testBuilders");

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

async function createTestClient( requiredColumns, testSuiteName, missingField, overrun ) {
    const client = buildTestClient( testSuiteName, missingField, overrun );
    const fields = [...Object.values(requiredColumns)];
    const values = [];
    const params = [];

    for (const field of fields ) {
        if ( client[field] !== undefined ) {
            params.push(client[field]);
            values.push(`$${params.length}`);
        }
    }
    const sql =    `
        INSERT INTO clients (${fields.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING *;
        `;
/*    console.log(`SQL: ${sql}`);
    console.log(`Params: ${params}`);*/

    const { rows } = await query(sql, params);
    if (rows.length === 0) throw new Error('Failed to create test client');
    return rows[0];
}

module.exports = {
    createTestUser,
    createTestClient,
};