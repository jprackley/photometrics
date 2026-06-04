const express = require('express');
const router = express.Router();
const {param} = require("express-validator");

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const C_HTTP = require("../../../utils/constants/cHTTP");
const {query} = require("../../db");
const {verifyAuthentication} = require("../../middleware/verifyAuthentication");

router.post('/:id/save',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid Employee UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'POST Employee Productivity Report - ');
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

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the employee'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/history',
    verifyAuthentication,
    asyncHandler(async (req, res) => {
        const result = await query(
            `SELECT * FROM employee_productivity_report_snapshots ORDER BY generated_at DESC;`
        )

        res.status(C_HTTP.STATUS.OK).json({reports: result.rows});
    })
)

router.get('/:id',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid Employee UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Employee Productivity Report - ');
        const {id} = req.params;
        const result = await query(
            `SELECT * FROM employee_productivity_report WHERE user_id = $1;`
        , [id])

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the employee'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;