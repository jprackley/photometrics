const {query} = require("../../api/db");

async function deleteTestUsers( users, testSuiteName ) {
    if ( users.length > 0 ) {
       for ( const user in users ) {
           const userSQL = `
               DELETE
               FROM users
               WHERE user_id = $1
               RETURNING user_id;
           `;
           const userParam = [user.user_id];
           const { rows } = await query(userSQL, userParam);
           if ( rows.length === 0 ) {
               throw new Error(`Failed to DELETE ${testSuiteName} Test User ${user.user_id}`);
           }
           console.log('Test User DELETED.');
       }
       return 0;
    } else {
        console.log('No Test Users DELETED.');
        return 0;
    }
}

module.exports = { deleteTestUsers };