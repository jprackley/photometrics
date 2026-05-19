const PAGINATE = {
    ALL: false,
    LIMIT: 50,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100,
    OFFSET: 0,
    PAGE: 1,
    MIN_PAGE: 1,
    SORT: 'created_at',
    ORDER: 'desc',
}
const PAGINATE_KEYS = ['limit', 'page', 'sort', 'order'];
const ASCENDING = 'asc';
const DESCENDING = 'desc';
/*
    PROJECTS: ['created_at', 'updated_at', 'project_name', 'status', 'start_time', 'due_time', 'completed_at'],
    TASKS: ['created_at', 'updated_at', 'task_name', 'category', 'status', 'start_time', 'due_time', 'completed_at'],
    IMAGE:['image_id', 'project_id', 'task_id', 'name', 'status', 'completed', 'created_at', 'updated_at'],
*/
module.exports = { PAGINATE, PAGINATE_KEYS, ASCENDING, DESCENDING };