const express = require('express');
const router = express.Router();

const C_TASK = require('../../../utils/constants/cTasks');

const asyncHandler = require('../../handlers/asyncHandler');
const { verbose } = require('../../handlers/expressHandlers');
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const { query } = require("../../db");
const C_HTTP = require("../../../utils/constants/cHTTP");
const {verifyAuthentication, requireRole} = require("../../middleware/verifyAuthentication");
const C_USER = require("../../../utils/constants/cUsers");

router.get(
    '/active',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Active Tasks - ');
        const { v } = req.query;
        let activeTasks = {
            active: 0,
            tasks: {}
        }
        const params = [C_TASK.STATUS.IN_PROGRESS]
        const isAcitveSQL = `
            SELECT *
            FROM tasks
            WHERE completed_at IS NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isAcitveSQL, params);

        activeTasks.active = rows.length;
        if ( v === 'true' ) {
            activeTasks.tasks = rows;
        }

        res.status(C_HTTP.STATUS.OK).json(activeTasks);
    })
)
router.get(
    '/completed',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Completed Tasks - ');
        const { v } = req.query;
        let completedTasks = {
            completed: 0,
            tasks: {}
        }
        const params = [C_TASK.STATUS.COMPLETED]
        const isCompletedSQL = `
            SELECT *
            FROM tasks
            WHERE completed_at IS NOT NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isCompletedSQL, params);

        completedTasks.completed = rows.length;
        if ( v === 'true' ) {
            completedTasks.tasks = rows;
        }

        res.json(completedTasks);
    })
)
router.get(
    '/remaining',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Remaining Tasks - ');
        const { v } = req.query;
        let remainingTasks = {
            remaining: 0,
            tasks: {}
        }
        const params = [
            C_TASK.STATUS.TODO,
            C_TASK.STATUS.ASSIGNED,
            C_TASK.STATUS.PAUSED
        ]
        const isRemainingSQL = `
            SELECT *
            FROM tasks
            WHERE completed_at IS NULL
              AND status::TEXT = $1 
               OR status::TEXT = $2 
               OR status::TEXT = $3;
        `
        const { rows } = await query(isRemainingSQL, params);

        remainingTasks.remaining = rows.length;
        if ( v === 'true' ) {
            remainingTasks.tasks = rows;
        }

        res.json(remainingTasks);
    })
)
router.get(
    '/total',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Total Tasks - ');
        const { v } = req.query;
        let totalTasks = {
            total: 0,
            tasks: {}
        }
        const isTotalSQL = `
            SELECT *
            FROM tasks
        `
        const { rows } = await query(isTotalSQL);

        totalTasks.total = rows.length;
        if ( v === 'true' ) {
            totalTasks.tasks = rows;
        }

        res.json(totalTasks);
    })
)

module.exports = router;