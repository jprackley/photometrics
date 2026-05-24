const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const {validationErrorHandler} = require("../../expressHandlers");
const { query } = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {param} = require("express-validator");

router.get(
    '/:id',
    param('id').isUUID().withMessage('Invalid User UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Employee Activity KPI - ');
        const {id: param} = req.params;
        const sql = `
            SELECT u.user_id,
                   t.task_id,
                   u.first_name,
                   u.middle_name,
                   u.last_name,
                   u.display_name,
                   concat(u.first_name, ' ', u.last_name, ' updated Task for Project ', p.project_name,
                          E'.\\n', t.task_name, ' updated at: ', t.updated_at,
                          E'.\\nStatus: ', t.status) AS description,
                   t.updated_at
            FROM users u
                     LEFT JOIN tasks t ON t.assigned_to = u.user_id
                     LEFT JOIN projects p ON p.project_id = t.project_id
            WHERE u.user_id = $1
            GROUP BY u.user_id,
                     t.task_id,
                     t.updated_at,
                     t.task_name,
                     t.status,
                     p.project_name

            ORDER BY t.updated_at DESC;
         `;
        const { rows } = await query(sql, [param]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.EMPLOYEE_ACTIVITY.NOT_FOUND}});
        res.json(rows);
    })
)

router.get(
    '/',
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Employee Activity KPI - ');
        const sql = `
            SELECT u.user_id,
                   t.task_id,
                   u.first_name,
                   u.middle_name,
                   u.last_name,
                   u.display_name,
                   concat(u.first_name, ' ', u.last_name, ' updated Task for Project ', p.project_name,
                          E'.\\n', t.task_name, ' updated at: ', t.updated_at,
                          E'.\\nStatus: ', t.status) AS description,
                   t.updated_at
            FROM users u
                     LEFT JOIN tasks t ON t.assigned_to = u.user_id
                     LEFT JOIN projects p ON p.project_id = t.project_id
            GROUP BY u.user_id,
                     t.task_id,
                     t.updated_at,
                     t.task_name,
                     t.status,
                     p.project_name

            ORDER BY t.updated_at DESC;
         `;
        const { rows } = await query(sql);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.EMPLOYEE_ACTIVITY.NOT_FOUND}});
        res.json(rows);
    })
)

module.exports = router;
