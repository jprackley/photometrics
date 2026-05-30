const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.post('/:id/save',
    [
        param('id').isUUID().withMessage('Invalid Project UUID')
    ],
    asyncHandler(async (req, res) => {

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

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

router.get('/history',
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
    [
        param('id').isUUID().withMessage('Invalid Project UUID')
    ],
    asyncHandler(async (req, res) => {

        const {id} = req.params;

        const sql = `
        SELECT *
        FROM project_delivery_report
        WHERE project_id = $1;
        `;

        const result = await query(sql, [id]);

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;