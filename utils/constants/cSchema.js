// Constants for PostgreSQL Schema
const TASK_CATEGORIES = ['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other'];

const STATUS = {
    PROJECT: ['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived'],
    TASK: ['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled'],
    IMAGE: ['Pending', 'In Progress', 'Completed', 'Rejected']
}

let MIN = {
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

    //For Tasks
    TASK_NAME_LENGTH: 255,
    TASK_DESC_LENGTH: 500,

    //For Images
    IMAGE_NAME_LENGTH: 255,
    IMAGE_DESC_LENGTH: 500,
    IMAGE_URL_LENGTH: 255,

    //For Time Entries
}

module.exports = { TASK_CATEGORIES, STATUS, MIN, MAX  };