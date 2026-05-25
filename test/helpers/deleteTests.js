const {query} = require("../../api/db");

/*
* Deletes Users
* @param {Array} users - Array of User IDs to be deleted
* @param {string} testSuiteName - Name of the test suite
* @returns {Promise<number>} - Number of deleted users
 */
async function deleteTestUsers( users, testSuiteName ) {
    if ( users.length > 0 ) {
       for ( const user of users ) {
           const sql = `
               DELETE
               FROM users
               WHERE user_id = $1
               RETURNING user_id;
           `;

           const { rows } = await query(sql, [user.user_id]);
           if ( rows.length === 0 ) {
               throw new Error(`Failed to DELETE ${testSuiteName} Test User ${user}`);
           }
           console.log('Test User DELETED.');
       }
       return 0;
    } else {
        console.log('No Test Users DELETED.');
        return 0;
    }
}
/*
* Deletes Clients
* @param {Array} clients - Array of Client IDs to be deleted
* @param {string} testSuiteName - Name of the test suite
* @returns {Promise<number>} - Number of deleted clients
 */
async function deleteTestClients( clients, testSuiteName ) {
    if ( clients.length > 0 ) {

        for ( const client of clients ) {
            console.log( `DELETING client_id; ${JSON.stringify(client.client_id)}` );
            const sql = `
                DELETE
                FROM clients
                WHERE client_id = $1
                RETURNING client_id;
            `;

            const { rows } = await query(sql, [client.client_id]);
            console.log( `RETURNING client_id; ${JSON.stringify(rows)}`);
            if ( rows.length === 0 ) {
                throw new Error(`Failed to DELETE ${testSuiteName} Test Client ${client}`);
            }
            console.log(`Test Client ID ${client} DELETED.`);
        }
        return 0;
    } else {
        console.log('No Test Clients DELETED.');
        return 0;
    }
}

async function deleteTestProjects( projects, testSuiteName ) {
    if ( projects.length > 0 ) {
        for ( const project of projects ) {
            const sql = `
                DELETE
                FROM projects
                WHERE project_id = $1
                RETURNING project_id;
            `;

            const { rows } = await query(sql, [project.project_id]);
            if ( rows.length === 0 ) {
                throw new Error(`Failed to DELETE ${testSuiteName} Test Project ${project}`);
            }
            console.log(`Test Project ID ${project} DELETED.`);
        }
        return 0;
    } else {
        console.log('No Test Projects DELETED.');
        return 0;
    }
}

async function deleteTestTasks( tasks, testSuiteName ) {
    if ( tasks.length > 0 ) {
        for ( const task of tasks ) {
            const sql = `
                DELETE
                FROM tasks
                WHERE task_id = $1
                RETURNING task_id;
            `;

            const { rows } = await query(sql, [task.task_id]);
            if ( rows.length === 0 ) {
                throw new Error(`Failed to DELETE ${testSuiteName} Test Task ${task}`);
            }
            console.log(`Test Task ID ${task} DELETED.`);
        }
        return 0;
    } else {
        console.log('No Test Tasks DELETED.');
        return 0;
    }
}

async function deleteTestImages( images, testSuiteName ) {
    if ( images.length > 0 ) {
        for ( const image of images ) {
            const sql = `
                DELETE
                FROM images
                WHERE image_id = $1
                RETURNING image_id;
            `;

            const { rows } = await query(sql, [image.image_id]);
            if ( rows.length === 0 ) {
                throw new Error(`Failed to DELETE ${testSuiteName} Test Image ${image}`);
            }
            console.log(`Test Image ID ${image} DELETED.`);
        }
        return 0;
    } else {
        console.log('No Test Image DELETED.');
        return 0;
    }
}

async function deleteTestTimeEntries( timeEntries, testSuiteName ) {
    if (timeEntries.length > 0) {
        for (const timeEntry of timeEntries) {
            const sql = `
                DELETE
                FROM time_entries
                WHERE time_entry_id = $1
                RETURNING time_entry_id;
            `;

            const {rows} = await query(sql, [timeEntry.time_entry_id]);
            if (rows.length === 0) {
                throw new Error(`Failed to DELETE ${testSuiteName} Test Time Entry ${timeEntry}`);
            }
            console.log(`Test Time Entry ID ${timeEntry} DELETED.`);
        }
        return 0;
    } else {
        console.log('No Test Time Entry DELETED.');
        return 0;
    }
}


module.exports = {
    deleteTestUsers,
    deleteTestClients,
    deleteTestProjects,
    deleteTestTasks,
    deleteTestImages,
    deleteTestTimeEntries,
};