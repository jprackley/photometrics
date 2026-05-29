const express = require('express');
const router = express.Router();

const asyncHandler = require('../handlers/asyncHandler');
const {validationErrorHandler} = require("../handlers/expressHandlers");
const { query } = require("../db");
const {param, body} = require("express-validator");
const C_HTTP = require("../../utils/constants/cHTTP");
const C_SETTINGS = require("../../utils/constants/cSettings");
const {verifyAuthentication} = require("../middleware/verifyAuthentication");


router.post(
    '/',
    verifyAuthentication,
    [
        body('user_id').isUUID().withMessage('Invalid user_id UUID'),
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
        validationErrorHandler(req, 'POST Settings - ');

        const fields = [
            ...Object.values(C_SETTINGS.REQUIRED_COLUMNS),
            ...Object.values(C_SETTINGS.MUTABLE_COLUMNS)
        ];
        const columns = [];
        const values = [];
        const params = [];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                params.push(req.body[field]);
                columns.push(field);
                values.push(`$${params.length}`);
            }
        });

        const sql = `
            INSERT INTO settings (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *;
        `;
        const { rows } = await query(sql, params);

        res.status(C_HTTP.STATUS.CREATED).json({settings: rows[0]});
    })
);

router.get(
    '/:id',
    verifyAuthentication,
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Settings - ');
        const {id: param} = req.params;

        const sql = `
            SELECT *
            FROM settings
            WHERE user_id = $1;
        `;
        const {rows } = await query(sql, [param]);

        res.status(C_HTTP.STATUS.OK).json({settings: rows});
    })
)

router.patch(
    '/:id',
    verifyAuthentication,
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
        validationErrorHandler(req, 'PATCH Settings - ');
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

        res.status(C_HTTP.STATUS.OK).json({settings: rows[0]});
    })
);

router.delete(
    '/:id',
    verifyAuthentication,
    param('id').isUUID().withMessage('Invalid Setting UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'DELETE Settings - ');
        const {id} = req.params;
        const {rows} = await query('DELETE FROM settings WHERE user_id = $1 RETURNING *', [id]);

        res.status(C_HTTP.STATUS.NO_CONTENT).json({settings: rows[0]});
    })
    )
module.exports = router;