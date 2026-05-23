const express = require('express');
const router = express.Router();

const C_USER = require('../../../utils/constants/cUsers');

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const { verbose } = require('../../handlers');
const {validationErrorHandler} = require("../../handlers");
const { query } = require("../../db");

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

        res.json(activeEmployees);
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

        res.json(totalEmployees);
    })
)

module.exports = router;