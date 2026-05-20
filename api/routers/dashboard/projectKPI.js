const express = require('express');
const router = express.Router();

const C_PROJECT = require('../../../utils/constants/cProjects');

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const { verbose } = require('../../validators/queryHandler');
const {handleValidation} = require("../../validators/queryHandler");
const { query } = require("../../db");

router.get(
    '/active',
    [verbose],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Active Projects - ');
        const { v } = req.query;
        let activeProjects = {
            active: 0,
            projects: {}
        }
        const params = [C_PROJECT.STATUS.IN_PROGRESS]
        const isAcitveSQL = `
            SELECT *
            FROM projects
            WHERE completed_at IS NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isAcitveSQL, params);

        activeProjects.active = rows.length;
        if ( v === 'true' ) {
            activeProjects.projects = rows;
        }

        res.json(activeProjects);
    })
)
router.get(
    '/completed',
    [verbose],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Completed Projects - ');
        const { v } = req.query;
        let completedProjects = {
            completed: 0,
            projects: {}
        }
        const params = [C_PROJECT.STATUS.COMPLETED]
        const isCompletedSQL = `
            SELECT *
            FROM projects
            WHERE completed_at IS NOT NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isCompletedSQL, params);

        completedProjects.active = rows.length;
        if ( v === 'true' ) {
            completedProjects.projects = rows;
        }

        res.json(completedProjects);
    })
)
router.get(
    '/remaining',
    [verbose],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Remaining Projects - ');
        const { v } = req.query;
        let remainingProjects = {
            remaining: 0,
            projects: {}
        }
        const params = [C_PROJECT.STATUS.TODO, C_PROJECT.STATUS.ON_HOLD]
        const isRemainingSQL = `
            SELECT *
            FROM projects
            WHERE completed_at IS NULL
              AND status::TEXT = $1 OR status::TEXT = $2;
        `
        const { rows } = await query(isRemainingSQL, params);

        remainingProjects.active = rows.length;
        if ( v === 'true' ) {
            remainingProjects.projects = rows;
        }

        res.json(remainingProjects);
    })
)
router.get(
    '/total',
    [verbose],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Total Projects - ');
        const { v } = req.query;
        let totalProjects = {
            total: 0,
            projects: {}
        }
        const isTotalSQL = `
            SELECT *
            FROM projects
        `
        const { rows } = await query(isTotalSQL);

        totalProjects.active = rows.length;
        if ( v === 'true' ) {
            totalProjects.projects = rows;
        }

        res.json(totalProjects);
    })
)

module.exports = router;