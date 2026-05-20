const REQUIRED_COLUMNS = {
    NAME: 'project_name',
};
const MUTABLE_COLUMNS = {
    DESCRIPTION: 'description',
    STATUS: 'status',
    PRIORITY: 'title',
    NOTES: 'company_name',
    START: 'start_time',
    SHOOT: 'shoot_time',
    DUE: 'due_time',
    COMPLETED: 'completed_at',
    CLIENT_ID: "client_id",
    MANAGER_ID: "manager_by",
    UPDATED_AT: "updated_at"
}
const IMMUTABLE_COLUMNS = {
    CREATED_AT: "created_at",
}
const MIN = {
    NAME: 1,
    DESCRIPTION: 0,
    NOTES: 0,
}
const MAX = {
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

module.exports = { REQUIRED_COLUMNS, IMMUTABLE_COLUMNS, MUTABLE_COLUMNS, MIN, MAX, STATUS, PRIORITY };