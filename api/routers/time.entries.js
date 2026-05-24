const express = require('express');
const {paginate, validationErrorHandler, buildPagination} = require("../handlers/expressHandlers");
const {param, body} = require("express-validator");
const asyncHandler = require('../handlers/asyncHandler');
const {query} = require("../db");
const C_NODE = require("../../utils/constants/cNodeServer");
const C_HTTP = require("../../utils/constants/cHTTP");
const C_TIME = require("../../utils/constants/cTimeEntries");
const router = express.Router();

//----------------------------------------------------------------------------------
// CREATE Time Entry
//----------------------------------------------------------------------------------
router.post(
    '/',
    [
        body('task_id').isUUID().withMessage('Invalid task_id UUID'),
        body('employee_id').isUUID().withMessage('Invalid employee_id UUID'),
        body('start_time').isISO8601().withMessage('Invalid start time format'),
        body('end_time').isISO8601().withMessage('Invalid end time format'),
        body('total_time').isDecimal().withMessage('Invalid duration format'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'CREATE Time Entry - ');

        const fields = [
            ...Object.values(C_TIME.REQUIRED_COLUMNS),
            ...Object.values(C_TIME.MUTABLE_COLUMNS)
        ];
        const columns = [];
        const values = [];
        const params = [];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                params.push(req.body[field]);
                columns.push(field);
                values.push(`$${params.length}`);
            }
        });

        const sql = `
            INSERT INTO time_entries (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *
        `;

        const {rows} = await query(sql, params);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// READ Time Entry:id
//----------------------------------------------------------------------------------
router.get(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid time_entry_id UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Time Entry - ');
        const { id } = req.params;
        const { rows } = await query('SELECT * FROM time_entries WHERE time_entry_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// READ Time Entries with pagination
//  - all: true will return all clients
//  - all: false will return paginated results
//  - page: page number
//  - limit: number of results per page
//  - sort: column to sort by
//  - order: ascending or descending
//  - q: search query
//----------------------------------------------------------------------------------
router.get(
    '/',
    [ paginate ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Time Entries - ');
        const {
            all = C_NODE.PAGINATE.ALL,
            page  = C_NODE.PAGINATE.PAGE,
            limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT,
            order = C_NODE.PAGINATE.ORDER,
            q
        } = req.query;

        // if all is true, return all users, otherwise paginate
        if (all === 'true') {
            const sql = `SELECT * FROM time_entries`;
            const { rows } = await query(sql);
            return res.json(rows);
        }

        // Basic whitelist for sort fields to avoid SQL injection
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });

        const sortable = [
            ...Object.values(C_TIME.REQUIRED_COLUMNS),
            ...Object.values(C_TIME.MUTABLE_COLUMNS),
            C_TIME.IMMUTABLE_COLUMNS.CREATED_AT
        ];
        const sortField = sortable.includes(String(sort)) ? sort : C_TIME.REQUIRED_COLUMNS.START;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE start_time::TEXT ILIKE $${params.length} 
                OR end_time::TEXT ILIKE $${params.length}
                OR total_time::TEXT ILIKE $${params.length}
            `;
        }
        const sql = `
            SELECT * FROM time_entries
            ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const { rows } = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total FROM time_entries ${where}`;
        const { rows: countRows } = await query(countSql, q ? [params[0]] : []);

        res.json({ data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total });
    })
)
//----------------------------------------------------------------------------------
// Patch Time Entry:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid time_entry_id UUID'),
        body('start_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid start time format'),
        body('end_time').optional({ values: 'null' }).isISO8601().withMessage('Invalid end time format'),
        body('total_time').optional({ values: 'null' }).isDecimal().withMessage('Invalid duration format')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'UPDATE Time Entry - ');
        const { id } = req.params;
        const fields = [
            ...Object.values(C_TIME.REQUIRED_COLUMNS),
            ...Object.values(C_TIME.MUTABLE_COLUMNS)
        ];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        });

        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
            error: {
                code: C_HTTP.CODE.BAD_REQUEST,
                message: C_HTTP.MESSAGE.BAD_REQUEST } });
        params.push(id);

        const sql = `
            UPDATE time_entries SET ${set.join(', ')}
            WHERE time_entry_id = $${params.length}
            RETURNING *
        `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// DELETE Time Entry:id
//----------------------------------------------------------------------------------
router.delete(
    '/:id',
    [param('id').isUUID().withMessage('Invalid time_entry_id UUID')],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'DELETE Time Entry - ');
        const {id} = req.params;
        const {rowCount} = await query('DELETE FROM time_entries WHERE time_entry_id = $1 RETURNING *', [id]);
        if (rowCount === 0) return res.status(404).json({error: {code: 404, message: 'Time entry not found'}});
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)
module.exports = router;