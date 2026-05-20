const express = require('express');
const {param, body} = require("express-validator");
const router = express.Router();

const { kpi } = require('../../validators/queryHandler');

const C_PROJECT = require('../../../utils/constants/cProjects');
const C_KPI = require('../../../utils/constants/cKPIs');

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const {handleValidation} = require("../../validators/queryHandler");

router.get('/',
    [kpi],
    asyncHandler(async (req, res) => {
        const isAcitveSQL = `
            SELECT *
            FROM projects
            WHERE completed_at IS NULL
              AND status::TEXT = ${C_PROJECT.STATUS.IN_PROGRESS};
        `
    }))

module.exports = router;