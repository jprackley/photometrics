const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {validationErrorHandler} = require("../../../api/handlers/expressHandlers");
const { query } = require("../../db");
const {param} = require("express-validator");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {verifyAuthentication, requireRole} = require("../../middleware/verifyAuthentication");
const C_USER = require("../../../utils/constants/cUsers");

router.get(
    '/',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Productivity KPI - ');

        const sql = `
            SELECT
                u.user_id,
                u.first_name,
                u.middle_name,
                u.last_name,
                u.display_name,

                COUNT(t.task_id) AS assigned_tasks,
                --Counts the number of assigned Tasks.

                COUNT(t.task_id) FILTER (
                    WHERE t.status = 'Completed'
                    ) AS completed_tasks,
                --Counts the number of completed Tasks.

                COUNT(t.task_id) FILTER (
                    WHERE t.status <> 'Completed'
                        AND t.status <> 'Cancelled'
                    ) AS pending_tasks,
                --Counts Pending Tasks by counting tasks that are not completed or canceled.

                COUNT(t.task_id) FILTER (
                    WHERE t.status <> 'Completed'
                        AND t.status <> 'Cancelled'
                        AND t.due_time < NOW()
                    ) AS overdue_tasks,
                --Counts Overdue Tasks by counting tasks that are not completed or canceled and are past due.

                COALESCE(SUM(t.total_time), 0) / 60.0 AS total_hours,
                --Calculates the total hours spent on all assigned Tasks.

                COALESCE(
                        ROUND(
                                (
                                            COUNT(t.task_id) FILTER (
                                        WHERE t.status = 'Completed'
                                        )::numeric
                                        / NULLIF(COUNT(t.task_id), 0)
                                    ) * 100,
                                2
                        ),
                        100
                ) AS completion_rate_percent
            --Calculates the completion rate as a percentage.
            --If there are no assigned tasks, the completion rate is 100%.

            FROM users u
                     LEFT JOIN tasks t
                               ON t.assigned_to = u.user_id
            WHERE u.account_role = 'Employee'

            GROUP BY
                u.user_id,
                u.last_name

            ORDER BY
                u.last_name;
        `;
        const {rows} = await query(sql);

        res.status(C_HTTP.STATUS.OK).json(rows);
    })
);

router.get(
    '/:id',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    param('id').isUUID().withMessage('Invalid User UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Productivity KPI - ');
        const {id: param} = req.params;
        const sql = `
            SELECT
                u.user_id,
                u.first_name,
                u.middle_name,
                u.last_name,
                u.display_name,

                COUNT(t.task_id) AS assigned_tasks,
                --Counts the number of assigned Tasks.

                COUNT(t.task_id) FILTER (
                    WHERE t.status = 'Completed'
                    ) AS completed_tasks,
                --Counts the number of completed Tasks.

                COUNT(t.task_id) FILTER (
                    WHERE t.status <> 'Completed'
                        AND t.status <> 'Cancelled'
                    ) AS pending_tasks,
                --Counts Pending Tasks by counting tasks that are not completed or canceled.

                COUNT(t.task_id) FILTER (
                    WHERE t.status <> 'Completed'
                        AND t.status <> 'Cancelled'
                        AND t.due_time < NOW()
                    ) AS overdue_tasks,
                --Counts Overdue Tasks by counting tasks that are not completed or canceled and are past due.

                COALESCE(SUM(t.total_time), 0) / 60.0 AS total_hours,
                --Calculates the total hours spent on all assigned Tasks.

                COALESCE(
                        ROUND(
                                (
                                            COUNT(t.task_id) FILTER (
                                        WHERE t.status = 'Completed'
                                        )::numeric
                                        / NULLIF(COUNT(t.task_id), 0)
                                    ) * 100,
                                2
                        ),
                        100
                ) AS completion_rate_percent
            --Calculates the completion rate as a percentage.
            --If there are no assigned tasks, the completion rate is 100%.

            FROM users u
                     LEFT JOIN tasks t
                               ON t.assigned_to = u.user_id
            
            WHERE u.user_id = $1 AND u.account_role = 'Employee'

            GROUP BY
                u.user_id,
                u.last_name

            ORDER BY
                u.last_name;
        `;
        const {rows} = await query(sql, [param]);

        res.status(C_HTTP.STATUS.OK).json(rows[0]);
    })
);

module.exports = router;
