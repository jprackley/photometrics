const express = require('express');
const {paginate, handleValidation, buildPagination} = require("../../utils/helpers/validation");
const {param, body} = require("express-validator");
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {query} = require("../db");
const C_NODE = require("../../utils/constants/cNodeServer");
const C_HTTP = require("../../utils/constants/cHTTP");
const router = express.Router();

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
        handleValidation(req, 'CREATE Time Entry - ');
        const {task_id, employee_id, start_time, end_time, total_time } = req.body;
        const sql = `
            INSERT INTO time_entries (task_id, employee_id, start_time, end_time, total_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const {rows} = await query(sql, [task_id, employee_id, start_time, end_time, total_time]);
        res.status(201).json(rows[0]);
    })
)
router.get(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid time_entry_id UUID')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Time Entry - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM time_entries WHERE time_entry_id = $1', [id]);

        if (rows.length === 0) return res.status(404).json({error: {code: 404, message: 'Time entry not found'}});
        res.json(rows[0]);
    })
)
router.get(
    '/',
    [ paginate ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Time Entries - ');
        const {
            page = C_NODE.PAGINATE.PAGE, limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT, order = C_NODE.PAGINATE.ORDER, q
        } = req.query;
        const {offset} = buildPagination({page: Number(page), limit: Number(C_NODE.PAGINATE.LIMIT)});
        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE task_id ILIKE $${params.length} OR employee_id ILIKE $${params.length}`;
        }
        const sql = `
            SELECT *
            FROM time_entries ${where}
            ORDER BY ${sort} ${order}
            LIMIT $${params.length + 1} 
            OFFSET $${params.length + 2}
        `;
        params.push(limit, offset);
        const {rows} = await query(sql, params);
        res.json({data: rows, page: Number(page), limit: Number(limit)});
    })
)
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid time_entry_id UUID'),
        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('end_time').optional().isISO8601().withMessage('Invalid end time format'),
        body('total_time').optional().isDecimal().withMessage('Invalid duration format')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Time Entry - ');
        const {id} = req.params;
        const fields = ['start_time', 'end_time', 'total_time'];
        const set = [];
        const params = [];
        fields.forEach(f => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        })
        if (set.length === 0) return res.status(400).json({error: {code: 400, message: 'No updatable fields provided'}});
        params.push(id);
        const sql = `
            UPDATE time_entries SET ${set.join(', ')}
            WHERE time_entry_id = $${params.length}
            RETURNING *
        `;
        const {rows} = await query(sql, params);
        if (rows.length === 0) return res.status(404).json({error: {code: 404, message: 'Time entry not found'}});
        res.json(rows[0]);
    })
)
router.delete(
    '/:id',
    [param('id').isUUID().withMessage('Invalid time_entry_id UUID')],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Time Entry - ');
        const {id} = req.params;
        const {rowCount} = await query('DELETE FROM time_entries WHERE time_entry_id = $1', [id]);
        if (rowCount === 0) return res.status(404).json({error: {code: 404, message: 'Time entry not found'}});
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)
module.exports = router;