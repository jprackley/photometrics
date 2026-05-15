// Constants for PostgreSQL
const USER_ROLES = ['Manager', 'Employee'];
const TASK_CATEGORIES = ['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other'];

const STATUS = {
    PROJECT: ['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived'],
    TASK: ['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled'],
    IMAGE: ['Pending', 'In Progress', 'Completed', 'Rejected']
}
const MIN = {
    //For Clients
    FIRST_NAME_LENGTH: 1,
    LAST_NAME_LENGTH: 1,
    COMPANY_NAME_LENGTH: 1,

    //For Projects
    PROJECT_NAME_LENGTH: 1,
    PROJECT_DESC_LENGTH: 0,
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
}

module.exports = { USER_ROLES, TASK_CATEGORIES, STATUS, MIN, MAX  };