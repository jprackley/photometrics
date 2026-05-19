
const STATUS = {
    TODO: 'To-Do',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const CATEGORY = {
    IMPORT: 'Import',
    CULL: 'Cull',
    EDIT: 'Edit',
    REVIEW: 'Quality Review',
    EXPORT: 'Export',
    DELIVERY: 'Delivery',
    OTHER: 'Other',
}

const PRIORITY = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
}

const REQUIRED_COLUMNS = {
    PROJECT: 'project_id',
    NAME: 'task_name',
    CATEGORY: 'category',
    PRIORITY: 'priority',
}

const MUTABLE_COLUMNS = {
    DESCRIPTION: 'description',
    STATUS: 'status',
    PROGRESS: 'progress',
    START: 'start_time',
    DUE: 'due_time',
    COMPLETED: 'completed_at',
    ASSIGNED_TO: 'assigned_to',
    ASSIGNED_BY: 'assigned_by',
    UPDATED: 'updated_at'
}

const IMMUTABLE_COLUMNS = {
    ID: 'task_id',
    CREATED: 'created_at',
}

const MIN = {
    NAME: 1,
    DESCRIPTION: 0,
    PROGRESS: 0.0,
}

const MAX = {
    NAME: 255,
    DESCRIPTION: 5000,
    PROGRESS: 100.0,
}

module.exports = {REQUIRED_COLUMNS, MUTABLE_COLUMNS, IMMUTABLE_COLUMNS, STATUS, CATEGORY, PRIORITY, MIN, MAX };