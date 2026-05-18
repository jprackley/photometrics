const CREATED_COLUMNS = {
    NAME: 'project_name',
    DESCRIPTION: 'description',
    STATUS: 'status',
    PRIORITY: 'title',
    NOTES: 'company_name',
    START: 'start_time',
    SHOOT: 'shoot_time',
    DUE: 'due_time',
    COMPLETED: 'completed_at',
};
const UPDATED_COLUMNS = {
    CLIENT_ID: "client_id",
    MANAGER_ID: "manager_by",
    CREATED_AT: "created_at",
    UPDATED_AT: "updated_at"
}
const MIN_LENGTH = {
    NAME: 1,
    DESCRIPTION: 0,
    NOTES: 5000,
}
const MAX_LENGTH = {
    NAME: 255,
    DESCRIPTION: 1000,
    NOTES: 5000,
}
const STATUS = {
    TODO: 'To-Do',
    IN_PROGRESS: 'In Progress',
    ON_HOLD: 'On Hold',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived',
}
const PRIORITY = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
}

module.exports = { CREATED_COLUMNS, UPDATED_COLUMNS, MIN_LENGTH, MAX_LENGTH, STATUS, PRIORITY };