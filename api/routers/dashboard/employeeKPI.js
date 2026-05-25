const express = require('express');
const router = express.Router();

const C_USER = require('../../../utils/constants/cUsers');

const asyncHandler = require('../../handlers/asyncHandler');
const { verbose } = require('../../handlers/expressHandlers');
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const { query } = require("../../db");
const C_HTTP = require("../../../utils/constants/cHTTP");

router.get(
    '/active',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Active Employees - ');
        const { v } = req.query;
        let activeEmployees = {
            active: 0,
            employees: {}
        }
        const params = [C_USER.ROLES.EMPLOYEE]
        const isAcitveSQL = `
            SELECT *
            FROM users
            WHERE account_role::TEXT = $1
              AND is_active::BOOLEAN = true;
        `
        const { rows } = await query(isAcitveSQL, params);

        activeEmployees.active = rows.length;
        if ( v === 'true' ) {
            activeEmployees.employees = rows;
        }

        res.status(C_HTTP.STATUS.OK).json(activeEmployees);
    })
)
router.get(
    '/total',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Total Employees - ');
        const { v } = req.query;
        let totalEmployees = {
            total: 0,
            employees: {}
        }
        const isTotalSQL = `
            SELECT *
            FROM users
            WHERE account_role::TEXT = $1;
        `
        const { rows } = await query(isTotalSQL, [C_USER.ROLES.EMPLOYEE]);

        totalEmployees.total = rows.length;
        if ( v === 'true' ) {
            totalEmployees.employees = rows;
        }

        res.status(C_HTTP.STATUS.OK).json(totalEmployees);
    })
)

module.exports = router;