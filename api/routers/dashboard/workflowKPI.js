const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const {handleValidation} = require("../../validators/queryHandler");
const { query } = require("../../db");
const {param} = require("express-validator");
const C_HTTP = require("../../../utils/constants/cHTTP");

router.get(
    '/:id',
    param('id').isUUID().withMessage('Invalid User UUID'),
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Workflow KPI - ');

        const { id: param } = req.params;

        const sql = `
            SELECT
                t.status,
                COUNT(t.task_id) AS count
            FROM users u
                     LEFT JOIN tasks t
                               ON t.assigned_to = u.user_id
            WHERE u.user_id = $1
            GROUP BY t.status
            ORDER BY t.status;
        `;

        const {rows} = await query(sql, [param]);

        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.WORKFLOW.NOT_FOUND}});
        res.json(rows);
    })
)

module.exports = router;