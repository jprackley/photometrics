const MIN = {
    NAME: 1,
    DESCRIPTION: 0,
    URL: 0,
}

const MAX = {
    NAME: 255,
    DESCRIPTION: 5000,
    URL: 5000,
}

const STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const REQUIRED_COLUMNS = {
    PROJECT_ID: 'project_id',
    NAME: 'name',
    STATUS: 'status',
    COMPLETED: 'completed_at',
};

const MUTABLE_COLUMNS = {
    TASK: 'task_id',
    DESCRIPTION: 'description',
    URL: 'url',
    UPDATED: 'updated_at'
}

const IMMUTABLE_COLUMNS = {
    ID: 'image_id',
    CREATED: 'created_at',
}

module.exports = {
    REQUIRED_COLUMNS, MUTABLE_COLUMNS, IMMUTABLE_COLUMNS, MIN, MAX, STATUS,
}