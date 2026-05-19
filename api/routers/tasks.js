const express = require('express');
const {body, param} = require("express-validator");
const router = express.Router();

const C_TASK = require('../../utils/constants/cTasks');
const C_HTTP = require("../../utils/constants/cHTTP");
const C_NODE = require('../../utils/constants/cNodeServer');
C_SCHEMA = require('../../utils/constants/cSchema');

const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation, buildPagination} = require('../../utils/helpers/validation');
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

        body('category').optional().isString().isIn(Object.values(C_TASK.CATEGORY)).withMessage('Invalid task category'),
        body('priority').optional().isString().isIn(Object.values(C_TASK.PRIORITY)).withMessage('Invalid task priority'),
        body('description').optional().isString().isLength(
            {
                min: C_SCHEMA.MIN.TASK_DESC_LENGTH,
                max: C_SCHEMA.MAX.TASK_DESC_LENGTH
            }).withMessage(`Task description must be between ${C_TASK.MIN.DESCRIPTION} and ${C_TASK.MAX.DESCRIPTION} characters`),

        body('status').optional().isString().isIn(Object.values(C_TASK.STATUS)).withMessage('Invalid task status'),
        body('progress').optional().isDecimal(
            {
                min: C_TASK.MIN.PROGRESS,
                max: C_TASK.MAX.PROGRESS,
            }).withMessage(`Task progress must be between ${C_TASK.MIN.PROGRESS} and ${C_TASK.MAX.PROGRESS} percent`),

        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
        body('assigned_by').optional().isUUID().withMessage('Invalid assigned_by UUID'),
        body('assigned_to').optional().isUUID().withMessage('Invalid assigned_to UUID')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Task - ');
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
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
)

//----------------------------------------------------------------------------------
// READ Task:id
//----------------------------------------------------------------------------------
router.get('/:id',
    [param('id').isUUID().withMessage('Invalid Task UUID.')],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Task:id - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM tasks WHERE task_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.MESSAGE.NOT_FOUND,
                message: 'Task ID not found'
            }
        });
        res.json(rows[0]);
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
        handleValidation(req, 'READ Tasks - ');
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
            return res.json(rows);
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
            OR description ILIKE $${params.length}
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

        res.json({data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total});
    })
)

//----------------------------------------------------------------------------------
// PATCH Task:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid Task UUID.'),
        body('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        body('task_name').optional().isString().isLength(
            {
                min: C_TASK.MIN.NAME,
                max: C_TASK.MAX.NAME
            })
            .withMessage(`Task name must be between ${C_TASK.MIN.NAME} and ${C_TASK.MAX.NAME} characters`),

        body('category').optional().isString().isIn(Object.values(C_TASK.CATEGORY)).withMessage('Invalid task category'),
        body('priority').optional().isString().isIn(Object.values(C_TASK.PRIORITY)).withMessage('Invalid task priority'),
        body('description').optional().isString().isLength(
            {
                min: C_TASK.MIN.DESCRIPTION,
                max: C_TASK.MAX.DESCRIPTION
            })
            .withMessage(`Task description must be between ${C_TASK.MIN.DESCRIPTION} and ${C_TASK.MAX.DESCRIPTION} characters`),

        body('status').optional().isString().isIn(Object.values(C_TASK.STATUS)).withMessage('Invalid task status'),
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
            RETURNING *
        `;
        const {rows} = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND
            }
        });
        res.json(rows[0]);
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
        handleValidation(req, 'DELETE Task:id - ');
        const {id} = req.params;
        const {rowCount} = await query('DELETE FROM tasks WHERE task_id = $1', [id]);
        if (rowCount === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND
            }
        });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)

module.exports = router;