const PAGINATE = {
    LIMIT: 50,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100,
    OFFSET: 0,
    PAGE: 1,
    MIN_PAGE: 1,
    SORT: 'created_at',
    ORDER: 'desc',
}
ASCENDING = 'asc';
DESCENDING = 'desc';

const SORTABLE = {
    USERS: {
        CREATED: 'created_at',
        UPDATED: 'updated_at',
        FIRST_NAME: 'first_name',
        LAST_NAME: 'last_name',
        EMAIL: 'email',
        ROLE: 'account_role'
    },
    //CLIENTS: ['created_at', 'updated_at', 'first_name', 'last_name', 'company_name'],
    PROJECTS: ['created_at', 'updated_at', 'project_name', 'status', 'start_time', 'due_time', 'completed_at'],
    TASKS: ['created_at', 'updated_at', 'task_name', 'category', 'status', 'start_time', 'due_time', 'completed_at'],
    IMAGE:['image_id', 'project_id', 'task_id', 'name', 'status', 'completed', 'created_at', 'updated_at'],
}

module.exports = { PAGINATE, SORTABLE, ASCENDING, DESCENDING };