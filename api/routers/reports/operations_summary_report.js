const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");
const {verifyAuthentication, requireRole} = require("../../middleware/verifyAuthentication");
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const C_USER = require("../../../utils/constants/cUsers");

router.get('/',
    verifyAuthentication,
    requireRole(C_USER.ROLES.MANAGER),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Operations Summary Report - ');
        const sql = `
            SELECT *
            FROM operations_summary_view;
        `;
        const result = await query(sql);
        res.status(C_HTTP.STATUS.OK).json({summary: result.rows[0]});
    })
)

module.exports = router;