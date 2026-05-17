// Constants for PostgreSQL Schema
const USER_ROLES = ['Manager', 'Employee'];
const SAFE_USER_RETURN = `
    user_id,
    first_name,
    last_name,
    email,
    last_login,
    created_at,
    updated_at,
    account_role`;
const TASK_CATEGORIES = ['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other'];

const STATUS = {
    PROJECT: ['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived'],
    TASK: ['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled'],
    IMAGE: ['Pending', 'In Progress', 'Completed', 'Rejected']
}

let MIN = {
    //For Clients and Users


    //For Projects
    PROJECT_NAME_LENGTH: 1,
    PROJECT_DESC_LENGTH: 0,

    //For Tasks
    TASK_NAME_LENGTH: 1,
    TASK_DESC_LENGTH: 0,

    //For Images
    IMAGE_NAME_LENGTH: 1,
    IMAGE_DESC_LENGTH: 0,
    IMAGE_URL_LENGTH: 0,

    //For Time Entries

}
const MAX = {
    //For Clients
    FIRST_NAME_LENGTH: 100,
    LAST_NAME_LENGTH: 100,
    COMPANY_NAME_LENGTH: 255,
    EMAIL_LENGTH: 255,

    //For Projects
    PROJECT_NAME_LENGTH: 255,
    PROJECT_DESC_LENGTH: 500,

    //For Tasks
    TASK_NAME_LENGTH: 255,
    TASK_DESC_LENGTH: 500,

    //For Images
    IMAGE_NAME_LENGTH: 255,
    IMAGE_DESC_LENGTH: 500,
    IMAGE_URL_LENGTH: 255,

    //For Time Entries
}

module.exports = { CLIENTS, USER_ROLES, SAFE_USER_RETURN, TASK_CATEGORIES, STATUS, MIN, MAX  };