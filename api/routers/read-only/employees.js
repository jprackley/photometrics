const express = require('express');
const router = express.Router();
const C_HTTP = require('../../../utils/constants/cHTTP');

const query = require("../../db").query;
const asyncHandler = require("../../handlers/asyncHandler");
const {validationErrorHandler} = require("../../handlers/expressHandlers")
const C_USER = require("../../../utils/constants/cUsers");

router.get('/',
   asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Employees - ');
        const sql = `
        SELECT ${C_USER.SAFE_RETURN}
        FROM users
        WHERE account_role = $1;
        `;
        const { rows } = await query(sql, [C_USER.ROLES.EMPLOYEE]);

        res.status(C_HTTP.STATUS.OK).json({employees: rows});
   })
)

router.get('/:id',
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Employee:id - ');
        const {id} = req.params;
        const sql = `
        SELECT ${C_USER.SAFE_RETURN}
        FROM users
        WHERE user_id = $1;
        `;
        const {rows} = await query(sql, [id]);

        res.status(C_HTTP.STATUS.OK).json({employees: rows[0]});
    })
)

module.exports = router;