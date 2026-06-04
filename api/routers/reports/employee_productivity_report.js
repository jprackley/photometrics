const express = require('express');
const router = express.Router();
const {param} = require("express-validator");

const asyncHandler = require('../../../api/handlers/asyncHandler');
const C_HTTP = require("../../../utils/constants/cHTTP");
const {query} = require("../../db");

router.post('/:id/save',
    [
        param('id').isUUID().withMessage('Invalid Employee UUID')
    ],
    asyncHandler(async (req, res) => {
        const {id} = req.params;
        const result = await query(
            `INSERT INTO employee_productivity_report_snapshots (user_id,
                                                                 employee_name,
                                                                 role,
                                                                 assigned_items,
                                                                 completed_items,
                                                                 review_items,
                                                                 tracked_time,
                                                                 efficiency,
                                                                 status)
            SELECT user_id,
                   employee_name,
                   role,
                   assigned_items,
                   completed_items,
                   review_items,
                   tracked_time,
                   efficiency,
                   status
            FROM employee_productivity_report
            WHERE user_id = $1
            RETURNING *;
            `
        , [id])

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/history',
    asyncHandler(async (req, res) => {
        const result = await query(
            `SELECT * FROM employee_productivity_report_snapshots ORDER BY generated_at DESC;`
        )

        res.status(C_HTTP.STATUS.OK).json({reports: result.rows});
    })
)

router.get('/:id',
    [
        param('id').isUUID().withMessage('Invalid Employee UUID')
    ],
    asyncHandler(async (req, res) => {
        const {id} = req.params;
        const result = await query(
            `SELECT * FROM employee_productivity_report WHERE user_id = $1;`
        , [id])

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;