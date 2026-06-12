const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const {verifyAuthentication, requireRole} = require("../../middleware/verifyAuthentication");
const C_USER = require("../../../utils/constants/cUsers");

router.post('/:id/save',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [
        param('id').isUUID().withMessage('Invalid Task UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'POST Task Time Report -')

        const {id} = req.params;
        const result = await query(
            `
                INSERT INTO task_time_report_snapshots
                (task_id,
                 task_name,
                 project,
                 due_date,
                 assigned_employee,
                 priority,
                 estimated_hours,
                 tracked_time,
                 utilization,
                 status,
                 due_status)
                
                SELECT task_id,
                       task_name,
                       project,
                       due_date,
                       assigned_employee,
                       priority,
                       estimated_hours,
                       tracked_time,
                       utilization,
                       status,
                       due_status
                FROM task_time_report
                WHERE task_id = $1
                RETURNING *;
            `
            , [id])

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the task'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Task Time Reports -')

        const sql = `
        SELECT *
        FROM task_time_report;
        `;

        const result = await query(sql);

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the task'});
        }
        res.status(C_HTTP.STATUS.OK).json({reports: result.rows});
    })
)

router.get('/history',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    asyncHandler(async (req, res) => {

        const result = await query(
            `
                SELECT *
                FROM task_time_report_snapshots
                ORDER BY generated_at DESC;
            `
        );

        res.status(C_HTTP.STATUS.OK).json({reports: result.rows});
    })
)

router.get('/:id',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [
        param('id').isUUID().withMessage('Invalid Task UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Task Time Report -')

        const {id} = req.params;

        const sql = `
        SELECT *
        FROM task_time_report
        WHERE task_id = $1;
        `;

        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the task'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;