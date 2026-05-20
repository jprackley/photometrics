
const MIN = {}
const MAX = {}

const REQUIRED_COLUMNS = {
    TASK: 'task_id',
    EMPLOYEE: 'employee_id',
    START: 'start_time',

}
const MUTABLE_COLUMNS = {
    END: 'end_time',
    TOTAL: 'total_time',
}
const IMMUTABLE_COLUMNS = {
    CREATED: 'created_at',
}

module.exports = {REQUIRED_COLUMNS, MUTABLE_COLUMNS, IMMUTABLE_COLUMNS, MIN, MAX };