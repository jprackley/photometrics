const express = require('express');
const router = express.Router();
const C_NODE = require('../../utils/constants/cNodeServer');
C_SCHEMA = require('../../utils/constants/cSchema');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation, buildPagination} = require('../../utils/helpers/validation');
const {query} = require("../db");
const {SORTABLE} = require("../../utils/constants/cNodeServer");
const {body, param} = require("express-validator");
const C_HTTP = require("../../utils/constants/cHTTP");

router.post(
    '/',
    [
        body('project_id').isUUID().withMessage('Invalid project_id UUID'),
        body('task_name').isString().isLength({min: C_SCHEMA.MIN.TASK_NAME_LENGTH, max: C_SCHEMA.MAX.TASK_NAME_LENGTH})
            .withMessage(`Task name must be between ${C_SCHEMA.MIN.TASK_NAME_LENGTH} and ${C_SCHEMA.MAX.TASK_NAME_LENGTH} characters`),
        body('category').isString().isIn(C_SCHEMA.TASK_CATEGORIES).withMessage('Invalid task category'),
        body('description').optional().isString().isLength({min: C_SCHEMA.MIN.TASK_DESC_LENGTH, max: C_SCHEMA.MAX.TASK_DESC_LENGTH})
            .withMessage(`Task description must be between ${C_SCHEMA.MIN.TASK_DESC_LENGTH} and ${C_SCHEMA.MAX.TASK_DESC_LENGTH} characters`),
        body('status').optional().isString().isIn(C_SCHEMA.STATUS.TASKS).withMessage('Invalid task status'),
        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
        body('assigned_by').isUUID().withMessage('Invalid assigned_by UUID'),
        body('assigned_to').optional().isUUID().withMessage('Invalid assigned_to UUID')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Task - ');
        const { project_id, task_name, category, description, status,
            start_time, due_time, completed_at, assigned_by, assigned_to} = req.body;
        const sql = `
            INSERT INTO tasks ( project_id, task_name, 
                               category, description, 
                               status, start_time, 
                               due_time, completed_at, 
                               assigned_by, assigned_to)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const {rows} = await query(sql, [project_id, task_name, category, description, status, start_time, due_time, completed_at, assigned_by, assigned_to]);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
)
router.get( '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Task:id - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM tasks WHERE task_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({error: {code: C_HTTP.MESSAGE.NOT_FOUND, message: 'Task ID not found'}});
        res.json(rows[0]);
    })
)
router.get('/',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Tasks - ');
        const {
            page = C_NODE.PAGINATE.PAGE, limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT, order = C_NODE.PAGINATE.ORDER, q
        } = req.query;
        const {offset} = buildPagination({page: Number(page), limit: Number(C_NODE.PAGINATE.LIMIT)});

        const sortable = SORTABLE.TASKS;
        const sortField = sortable.includes(String(sort)) ? sort : SORTABLE.TASKS[0];
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE task_name ILIKE $${params.length} OR description ILIKE $${params.length} 
            OR status ILIKE $${params.length} OR category ILIKE $${params.length}`;
        }
        const sql = `
            SELECT *
            FROM tasks ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} 
            OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const {rows} = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total
                          FROM tasks ${where}`;
        const {rows: countRows} = await query(countSql, q ? [params[0]] : []);

        res.json({data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total});
    })
)

router.patch(
    '/:id',
    [
        param('id').isUUID(),
        body('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        body('task_name').optional().isString().isLength({min: C_SCHEMA.MIN.TASK_NAME_LENGTH, max: C_SCHEMA.MAX.TASK_NAME_LENGTH})
            .withMessage(`Task name must be between ${C_SCHEMA.MIN.TASK_NAME_LENGTH} and ${C_SCHEMA.MAX.TASK_NAME_LENGTH} characters`),
        body('category').optional().isString().isIn(C_SCHEMA.TASK_CATEGORIES).withMessage('Invalid task category'),
        body('description').optional().isString().isLength({min: C_SCHEMA.MIN.TASK_DESC_LENGTH, max: C_SCHEMA.MAX.TASK_DESC_LENGTH})
            .withMessage(`Task description must be between ${C_SCHEMA.MIN.TASK_DESC_LENGTH} and ${C_SCHEMA.MAX.TASK_DESC_LENGTH} characters`),
        body('status').optional().isString().isIn(C_SCHEMA.STATUS.TASK).withMessage('Invalid task status'),
        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
        body('assigned_by').optional().isUUID().withMessage('Invalid assigned_by UUID'),
        body('assigned_to').optional().isUUID().withMessage('Invalid assigned_to UUID')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, `UPDATE Task:id - `);
        const {id} = req.params;
        const fields = [
            'project_id', 'task_name', 'category', 'description', 'status',
            'start_time', 'due_time', 'completed_at', 'assigned_by', 'assigned_to'
        ];
        const set = [];
        const params = [];
        fields.forEach(f => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        })
        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({error: {code: C_HTTP.MESSAGE.BAD_REQUEST, message: 'No updatable fields provided'}});
        params.push(id);
        const sql = `
            UPDATE tasks SET ${set.join(', ')}, updated_at = now()
            WHERE task_id = $${params.length}
            RETURNING *
        `;
        const {rows} = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({error: {code: C_HTTP.MESSAGE.NOT_FOUND, message: 'Task not found'}});
        res.json(rows[0]);
    })
)

router.delete(
    '/:id',
    [
        param('id').isUUID()
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Task:id - ');
        const {id} = req.params;
        const {rowCount} = await query('DELETE FROM tasks WHERE task_id = $1', [id]);
        if (rowCount === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({error: {code: C_HTTP.MESSAGE.NOT_FOUND, message: 'Task not found'}});
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)

module.exports = router;