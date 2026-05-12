// Constants for PostgreSQL
const USER_ROLES = ['Manager', 'Employee'];
const PROJECT_STATUSES = ['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived'];
const TASK_STATUSES = ['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled'];
const TASK_CATEGORIES = ['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other'];
const IMAGE_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected'];

module.exports = { USER_ROLES, PROJECT_STATUSES, TASK_STATUSES, TASK_CATEGORIES, IMAGE_STATUSES };