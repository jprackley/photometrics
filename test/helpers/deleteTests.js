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
           const userSQL = `
               DELETE
               FROM users
               WHERE user_id = $1
               RETURNING user_id;
           `;
           const userParam = [user];
           const { rows } = await query(userSQL, userParam);
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
            const clientSQL = `
                DELETE
                FROM clients
                WHERE client_id = $1
                RETURNING client_id;
            `;
            const clientParam = [client];
            const { rows } = await query(clientSQL, clientParam);
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

module.exports = {
    deleteTestUsers,
    deleteTestClients
};