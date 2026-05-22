const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const {handleValidation} = require("../../validators/queryHandler");
const { query } = require("../../db");
const {param} = require("express-validator");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.get(
    '/',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Project Progress KPI - ');
        const sql = `
            SELECT *
            FROM project_progress_view;
        `;
        const {rows } = await query(sql);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.PROJECTS_PROGRESS}});
        res.json(rows);
    }));

router.get(
    '/:id',
    param('id').isUUID().withMessage('Invalid Project UUID'),
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Project Progress KPI - ');
        const {id: param} = req.params;
        const sql = `
            SELECT *
            FROM project_progress_view
            WHERE project_id = $1;
        `;
        const {rows } = await query(sql, param);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.PROJECTS_PROGRESS}});
        res.json(rows);
    }));

module.exports = router;