const MIN_LENGTH = {
    FIRST_NAME: 1,
    LAST_NAME: 1,
    EMAIL: 1,
}
const MAX_LENGTH = {
    FIRST_NAME: 100,
    LAST_NAME: 100,
    EMAIL: 255,
}
const ROLES = {
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
}
const CREATED_COLUMNS = {
    FIRST_NAME: 'first_name',
    LAST_NAME: 'last_name',
    EMAIL: 'email',
    PASSWORD: 'password_hash',
    ROLE: 'account_role'
}
const UPDATED_COLUMNS = {
    CREATED: 'created_at',
    UPDATED: 'updated_at',
}
const SAFE_RETURN = `
    user_id,
    first_name,
    last_name,
    email,
    last_login,
    created_at,
    updated_at,
    account_role`;

module.exports = {SAFE_RETURN,UPDATED_COLUMNS, CREATED_COLUMNS, MIN_LENGTH, MAX_LENGTH, ROLES};