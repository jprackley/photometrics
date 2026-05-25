const bcrypt = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../../api/db");
const {
    buildTestUser,
    buildTestClient,
    buildTestProject, buildTestTask
} = require("./testBuilders");

async function createTestUser( role, testSuiteName, missingField, overrunField ) {
    const user = buildTestUser(role, testSuiteName, missingField, overrunField);
    console.log(`Test User Object has been created`);

    const hashedPassword = await bcrypt.hash(user.password_hash, C_AUTH.SALT_ROUNDS);

    try {
        const fields = [...Object.keys(user)];
        const values = [];
        const params = [];

        for (const field of fields) {
            if (field === 'password_hash') {
                params.push(hashedPassword);
                values.push(`$${params.length}`);
            } else if (user[field] !== undefined) {
                params.push(user[field]);
                values.push(`$${params.length}`);
            }
        }

        const userSQL = `
            INSERT INTO users (${fields.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *;
        `;

        const {rows} = await query(userSQL, params);
        if (rows === 0) {
            console.error(`Failed to INSERT Test ${role} User`);
        } else {
            console.log(`Test ${role} User Created in the database.`);
            return rows[0];
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createTestClient( requiredColumns, testSuiteName, missingField, overrun ) {
    const client = buildTestClient( testSuiteName, missingField, overrun );
    console.log(`Test Client Object has been created`);

    try {
        const fields = [...Object.values(requiredColumns)];
        const values = [];
        const params = [];

        for (const field of fields) {
            if (client[field] !== undefined) {
                params.push(client[field]);
                values.push(`$${params.length}`);
            }
        }
        const sql = `
        INSERT INTO clients (${fields.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING *;
        `;

        const {rows} = await query(sql, params);
        if (rows.length === 0) {
            console.error('Failed to create test client in the database');
        } else {
            console.log(`Test Client Created in the database.`);
            return rows[0];
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createTestProject(testSuiteName, manager, client ) {
    const project = buildTestProject(testSuiteName, manager, client);
    console.log(`Test Project Object has been created`);

    const fields = [...Object.keys(project)];
    const values = [];
    const params = [];

    try {
        for (const field of fields) {
            if (project[field] !== undefined) {
                params.push(project[field]);
                values.push(`$${params.length}`);
            }
        }

        const sql = `
        INSERT INTO projects (${fields.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING *;
    `;

        const {rows} = await query(sql, params);
        if (rows.length === 0) {
            console.error('Failed to create project in the database');
        } else {
            console.log(`Test Project Created in the database.`);
            return rows[0];
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createTestTask( testSuiteName, project, manager, employee ) {
    const task = buildTestTask( testSuiteName, project, manager, employee );
    console.log(`Test Task Object has been created`);

    try {
        const fields = [...Object.keys(task)];
        const values = [];
        const params = [];

        for (const field of fields) {
            if (task[field] !== undefined) {
                params.push(task[field]);
                values.push(`$${params.length}`);
            }
        }

        const sql = `
    INSERT INTO tasks (${fields.join(', ')})
    VALUES (${values.join(', ')})
    RETURNING *;
    `;

        const {rows} = await query(sql, params);
        if (rows.length === 0) {
            console.error('Failed to create task in the database');
        } else {
            console.log(`Test Task Created in the database.`);
            return rows[0];
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    createTestUser,
    createTestClient,
    createTestProject,
    createTestTask,
};