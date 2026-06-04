const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {verifyAuthentication} = require("../../middleware/verifyAuthentication");
const {validationErrorHandler} = require("../../handlers/expressHandlers");

router.post('/:id/save',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid Project UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'POST Project Delivery Report - ')

        const {id} = req.params;
        const result = await query(
            `
                INSERT INTO project_delivery_report_snapshots
                (project_id,
                 project_name,
                 client,
                 due_date,
                 total_images,
                 completed_images,
                 remaining_images,
                 progress,
                 project_status,
                 due_status,
                 open_tasks,
                 review_items,
                 assigned_employees)
                
                SELECT project_id,
                       project_name,
                       client,
                       due_date,
                       total_images,
                       completed_images,
                       remaining_images,
                       progress,
                       status,
                       due_status,
                       open_tasks,
                       review_items,
                       assigned_employees
                FROM project_delivery_report
                WHERE project_id = $1
                RETURNING *;
            `
        , [id])

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the project'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/history',
    verifyAuthentication,
    asyncHandler(async (req, res) => {

        const result = await query(
            `
                SELECT *
                FROM project_delivery_report_snapshots
                ORDER BY generated_at DESC;
            `
        );

        res.status(C_HTTP.STATUS.OK).json({reports: result.rows});
    })
)

router.get('/:id',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid Project UUID')
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Project Delivery Report - ')

        const {id} = req.params;

        const sql = `
        SELECT *
        FROM project_delivery_report
        WHERE project_id = $1;
        `;

        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({message: 'No report found for the project'});
        }
        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;