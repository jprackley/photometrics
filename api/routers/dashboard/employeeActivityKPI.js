const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {validationErrorHandler} = require("../../../api/handlers/expressHandlers");
const { query } = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {param} = require("express-validator");
const {verifyAuthentication} = require("../../middleware/verifyAuthentication");

router.get(
    '/:id',
    //verifyAuthentication,
    param('id').isUUID().withMessage('Invalid User UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Employee Activity KPI - ');
        const {id: param} = req.params;
        const sql = `
            SELECT *
            FROM employee_activity_view
            WHERE user_id = $1;
        `;
        const { rows } = await query(sql, [param]);

        res.status(C_HTTP.STATUS.OK).json(rows);
    })
)

router.get(
    '/',
    //verifyAuthentication,
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Employee Activity KPI - ');
        const sql = `
            SELECT *
            FROM employee_activity_view
         `;
        const { rows } = await query(sql);

        res.status(C_HTTP.STATUS.OK).json(rows);
    })
)

module.exports = router;
