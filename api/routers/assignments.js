const express = require('express');
const router = express.Router();

const asyncHandler = require('../handlers/asyncHandler');
const {validationErrorHandler} = require("../handlers/expressHandlers");
const { query } = require("../db");
const C_HTTP = require("../../utils/constants/cHTTP");

router.get(
    '/',
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Assignments - ');
        const sql = `
            SELECT *
            FROM assignments;
        `;
        const {rows } = await query(sql);

        res.status(C_HTTP.STATUS.OK).json({assignments: rows});
    })
);

router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Assignments - ');
        const {id: param} = req.params;
        const sql = `
            SELECT *
            FROM assignments
            WHERE task_id = $1;
        `;
        const {rows } = await query(sql, [param]);

        res.status(C_HTTP.STATUS.OK).json({assignments: rows[0]});
    })
);

module.exports = router;
