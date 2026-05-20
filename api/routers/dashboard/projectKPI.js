const express = require('express');
const {param, body} = require("express-validator");
const router = express.Router();

const { kpi } = require('../../validators/queryHandler');

const C_PROJECT = require('../../../utils/constants/cProjects');
const C_KPI = require('../../../utils/constants/cKPIs');

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const {handleValidation} = require("../../validators/queryHandler");
const {query} = require("../../db");

router.get('/active',
    [kpi],
    asyncHandler(async (req, res) => {
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
        activeProjects.projects = rows;

        res.json(activeProjects);
    }))

module.exports = router;