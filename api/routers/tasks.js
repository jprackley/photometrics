const express = require('express');
const {body, param} = require("express-validator");
const router = express.Router();

const C_TASK = require('../../utils/constants/cTasks');
const C_HTTP = require("../../utils/constants/cHTTP");
const C_NODE = require('../../utils/constants/cNodeServer');

const asyncHandler = require('../handlers/asyncHandler');
const {validationErrorHandler, buildPagination} = require('../handlers/expressHandlers');
const {query} = require("../db");

//----------------------------------------------------------------------------------
// POST Task
//----------------------------------------------------------------------------------
router.post(
    '/',
    [
        body('project_id').isUUID().withMessage('Invalid project_id UUID'),
        body('task_name').isString().isLength(
            {
                min: C_TASK.MIN.NAME,
                max: C_TASK.MAX.NAME,
            }).withMessage(`Task name must be between ${C_TASK.MIN.NAME} and ${C_TASK.MAX.NAME} characters.`),

        body('category').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.CATEGORY)).withMessage('Invalid task category'),
        body('priority').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.PRIORITY)).withMessage('Invalid task priority'),
        body('description').optional({ values: 'null' }).isString().isLength(
            {
                min: C_TASK.MIN.DESCRIPTION,
                max: C_TASK.MAX.DESCRIPTION,
            }).withMessage(`Task description must be between ${C_TASK.MIN.DESCRIPTION} and ${C_TASK.MAX.DESCRIPTION} characters`),

        body('status').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.STATUS)).withMessage('Invalid task status'),
        body('progress').optional({ values: 'null' }).isDecimal(
            {
                min: C_TASK.MIN.PROGRESS,
                max: C_TASK.MAX.PROGRESS,
            }).withMessage(`Task progress must be between ${C_TASK.MIN.PROGRESS} and ${C_TASK.MAX.PROGRESS} percent`),

        body('start_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional({ values: 'null' }).isISO8601().withMessage('Invalid completed time format'),
        body('assigned_by').optional({ values: 'null' }).isUUID().withMessage('Invalid assigned_by UUID'),
        body('assigned_to').optional({ values: 'null' }).isUUID().withMessage('Invalid assigned_to UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'CREATE Task - ');
        const columnKeys = [
            ...Object.values(C_TASK.REQUIRED_COLUMNS),
            ...Object.values(C_TASK.MUTABLE_COLUMNS)
        ]
        const params = [];
        const values = [];
        const columns = [];

        for (const column of columnKeys) {
            if (req.body[column] !== undefined) {
                columns.push(column);
                params.push(req.body[column]);
                values.push(`$${params.length}`);
            }
        }
        const sql = `
            INSERT INTO tasks (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *
        `;
        const {rows} = await query(sql, params);
        res.status(C_HTTP.STATUS.CREATED).json({tasks: rows[0]});
    })
)

//----------------------------------------------------------------------------------
// READ Task:id
//----------------------------------------------------------------------------------
router.get('/:id',
    [param('id').isUUID().withMessage('Invalid Task UUID.')],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Task:id - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM tasks WHERE task_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.MESSAGE.NOT_FOUND,
                message: 'Task ID not found'
            }
        });
        res.status(C_HTTP.STATUS.OK).json({tasks: rows[0]});
    })
)

//----------------------------------------------------------------------------------
// READ Tasks
// 1. All tasks
// 2. All tasks with pagination
// 3. All tasks with pagination and sorting
// 4. All tasks with pagination and sorting and filtering
//----------------------------------------------------------------------------------
router.get('/',
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Tasks - ');
        const {
            all = C_NODE.PAGINATE.ALL,
            page = C_NODE.PAGINATE.PAGE,
            limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT,
            order = C_NODE.PAGINATE.ORDER,
            q
        } = req.query;

        if (all === 'true') {
            const {rows} = await query(`SELECT *
                                        FROM tasks`);
            return res.status(C_HTTP.STATUS.OK).json({tasks: rows});
        }
        const {offset} = buildPagination({page: Number(page), limit: Number(C_NODE.PAGINATE.LIMIT)});

        const sortable = [
            ...Object.values(C_TASK.REQUIRED_COLUMNS),
            ...Object.values(C_TASK.MUTABLE_COLUMNS),
            C_TASK.IMMUTABLE_COLUMNS.CREATED
        ];
        const sortField = sortable.includes(String(sort)) ? sort : C_TASK.IMMUTABLE_COLUMNS.CREATED;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `
            WHERE task_name ILIKE $${params.length} 
            OR category::TEXT ILIKE $${params.length} 
            OR priority::TEXT ILIKE $${params.length}
            OR description ILIKE $${params.length}
            OR status::TEXT ILIKE $${params.length}
            `;
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

        res.json({tasks: rows, page: Number(page), limit: Number(limit), total: countRows[0].total});
    })
)

//----------------------------------------------------------------------------------
// PATCH Task:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid Task UUID.'),
        body('project_id').optional({ values: 'null' }).isUUID().withMessage('Invalid project_id UUID'),
        body('task_name').optional({ values: 'null' }).isString().isLength(
            {
                min: C_TASK.MIN.NAME,
                max: C_TASK.MAX.NAME
            })
            .withMessage(`Task name must be between ${C_TASK.MIN.NAME} and ${C_TASK.MAX.NAME} characters`),

        body('category').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.CATEGORY)).withMessage('Invalid task category'),
        body('priority').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.PRIORITY)).withMessage('Invalid task priority'),
        body('description').optional({ values: 'null' }).isString().isLength(
            {
                min: C_TASK.MIN.DESCRIPTION,
                max: C_TASK.MAX.DESCRIPTION
            })
            .withMessage(`Task description must be between ${C_TASK.MIN.DESCRIPTION} and ${C_TASK.MAX.DESCRIPTION} characters`),

        body('status').optional({ values: 'null' }).isString().isIn(Object.values(C_TASK.STATUS)).withMessage('Invalid task status'),
        body('start_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional({ values: 'null' }).isISO8601().withMessage('Invalid completed time format'),
        body('assigned_by').optional({ values: 'null' }).isUUID().withMessage('Invalid assigned_by UUID'),
        body('assigned_to').optional({ values: 'null' }).isUUID().withMessage('Invalid assigned_to UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, `UPDATE Task:id - `);
        const {id} = req.params;
        const fields = [
            ...Object.values(C_TASK.REQUIRED_COLUMNS),
            ...Object.values(C_TASK.MUTABLE_COLUMNS)
        ];
        const set = [];
        const params = [];
        fields.forEach(f => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        })
        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
            error: {
                code: C_HTTP.CODE.BAD_REQUEST,
                message: C_HTTP.MESSAGE.BAD_REQUEST,
            }
        });
        params.push(id);
        const sql = `
            UPDATE tasks
            SET ${set.join(', ')},
                updated_at = now()
            WHERE task_id = $${params.length}
            RETURNING *;
        `;
        const {rows} = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND
            }
        });
        res.status(C_HTTP.STATUS.OK).json({tasks: rows[0]});
    })
)

router.patch('/:id/timer/start',
    [param('id').isUUID().withMessage('Invalid task UUID')],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'Start Task Timer - ');

        const { id } = req.params;
        const sql = `
            UPDATE tasks
            SET start_time = $1
            WHERE task_id = $2
            RETURNING *;
        `;
        const {rows} = await query(
            sql,
            [new Date(Date.now()).toISOString, id]
        );
        return res.status(C_HTTP.STATUS.OK).json({task: rows[0]});
    })
)

router.patch('/:id/timer/stop',
    [param('id').isUUID().withMessage('Invalid task UUID')],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'Stop Task Timer - ');

        const { id } = req.params;
        const sql = `
            UPDATE tasks
            SET 
                stop_time = $1::TIMESTAMPTZ,
                total_time = $1::TIMESTAMPTZ - start_time
            WHERE task_id = $2
            RETURNING *;
        `;
        const {rows} = await query(
            sql,
            [new Date(Date.now()).toISOString, id]
        );
        return res.status(C_HTTP.STATUS.OK).json({tasks: rows[0]});
    })
)
//----------------------------------------------------------------------------------
// DELETE Task:id
//----------------------------------------------------------------------------------
router.delete(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid Task UUID.'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'DELETE Task:id - ');
        const {id} = req.params;
        const {rows} = await query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [id]);
        if (rows === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND
            }
        });
        res.status(C_HTTP.STATUS.NO_CONTENT).send({tasks: rows[0]});
    })
)

module.exports = router;