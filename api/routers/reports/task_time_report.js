const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.post('/:id/save',
    [
        param('id').isUUID().withMessage('Invalid Task UUID')
    ],
    asyncHandler(async (req, res) => {

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

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/history',
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
    [
        param('id').isUUID().withMessage('Invalid Task UUID')
    ],
    asyncHandler(async (req, res) => {

        const {id} = req.params;

        const sql = `
        SELECT *
        FROM task_time_report
        WHERE task_id = $1;
        `;

        const result = await query(sql, [id]);

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;