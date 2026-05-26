const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {validationErrorHandler} = require("../../../api/handlers/expressHandlers");
const { query } = require("../../db");
const {param} = require("express-validator");
const C_HTTP = require("../../../utils/constants/cHTTP");

router.get(
    '/:id',
    param('id').isUUID().withMessage('Invalid User UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Workflow KPI - ');

        const { id: param } = req.params;

        const sql = `
            SELECT
                CASE
                    WHEN t.status NOT IN ('Completed', 'Cancelled')
                        AND t.due_time < NOW()
                        THEN 'Overdue'
                    ELSE t.status::text
                    END AS status,
                COUNT(t.task_id) AS count
            FROM users u
                     LEFT JOIN tasks t
                               ON t.assigned_to = u.user_id
            WHERE u.user_id = $1
            GROUP BY t.status,
                     t.due_time
            ORDER BY t.status;
        `;

        const {rows} = await query(sql, [param]);

        res.status(C_HTTP.STATUS.OK).json(rows);
    })
)

module.exports = router;