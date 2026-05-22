const express = require('express');
const router = express.Router();

const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation} = require("../validators/queryHandler");
const { query } = require("../db");
const {param, body} = require("express-validator");
const C_HTTP = require("../../utils/constants/cHTTP");
const C_SETTINGS = require("../../utils/constants/cSettings");


router.post(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid Setting UUID'),
        body('theme').optional({values: "falsy"}).isIn(['light', 'dark']).withMessage('Invalid Theme'),
        body('accentColor').optional({values: "falsy"}).isHexColor().withMessage('Invalid Accent Color'),
        body('compactTables').optional({values: "falsy"}).isBoolean().withMessage('Invalid Compact Tables'),
        body('showDashboardTips').optional({values: "falsy"}).isBoolean().withMessage('Invalid Show Dashboard Tips'),
        body('notifications').optional({values: "falsy"}).isBoolean().withMessage('Invalid Notifications'),
        body('companyName').optional({values: "falsy"}).isString().withMessage('Invalid Company Name'),
        body('language').optional({values: "falsy"}).isIn(['en', 'es']).withMessage('Invalid Language'),
        body('timezone').optional({values: "falsy"}).isIn(['America/New_York', 'America/Los_Angeles', 'Europe/London']).withMessage('Invalid Timezone'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'POST Settings - ');
        const {setting_id, setting_value} = req.body;
        const sql = `
            INSERT INTO settings (user_id)
            VALUES ($1)
            RETURNING *;
        `;
        const {rows } = await query(sql, [setting_id, setting_value]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
    })
);

router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'GET Settings - ');
        const {id: param} = req.params;

        const sql = `
            SELECT *
            FROM settings
            WHERE user_id = $1;
        `;
        const {rows } = await query(sql, [param]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND)
            .json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.SETTINGS.NOT_FOUND}});
        res.json(rows);
    })
)

router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid Setting UUID'),
        body('theme').optional({values: "falsy"}).isIn(['light', 'dark']).withMessage('Invalid Theme'),
        body('accentColor').optional({values: "falsy"}).isHexColor().withMessage('Invalid Accent Color'),
        body('compactTables').optional({values: "falsy"}).isBoolean().withMessage('Invalid Compact Tables'),
        body('showDashboardTips').optional({values: "falsy"}).isBoolean().withMessage('Invalid Show Dashboard Tips'),
        body('notifications').optional({values: "falsy"}).isBoolean().withMessage('Invalid Notifications'),
        body('companyName').optional({values: "falsy"}).isString().withMessage('Invalid Company Name'),
        body('language').optional({values: "falsy"}).isIn(['en', 'es']).withMessage('Invalid Language'),
        body('timezone').optional({values: "falsy"}).isIn(['America/New_York', 'America/Los_Angeles', 'Europe/London']).withMessage('Invalid Timezone'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'PATCH Settings - ');
        const { id } = req.params;
        const fields = [
            ...Object.values(C_SETTINGS.REQUIRED_COLUMNS),
            ...Object.values(C_SETTINGS.MUTABLE_COLUMNS)
        ];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        });

        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
            error: {
                code: C_HTTP.CODE.BAD_REQUEST,
                message: C_HTTP.MESSAGE.BAD_REQUEST } });
        params.push(id);

        const sql = `
            UPDATE settings SET ${set.join(', ')}, updated_at = now()
            WHERE user_id = $${params.length}
            RETURNING *
        `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.SETTINGS.NOT_FOUND } });
        res.json(rows[0]);
    })
);

router.delete(
    '/:id',
    param('id').isUUID().withMessage('Invalid Setting UUID'),
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Settings - ');
        const {id} = req.params;
        const {rows} = await query('DELETE FROM settings WHERE user_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.SETTINGS.NOT_FOUND } });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
    )
module.exports = router;