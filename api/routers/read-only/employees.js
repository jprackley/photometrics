const express = require('express');
const router = express.Router();

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
        if (rows.length === 0) return res.status(404).json({error: {code: 404, message: 'Employees not found'}});

        res.json(rows);
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
        if (rows.length === 0) return res.status(404).json({error: {code: 404, message: 'Employee not found'}});
        res.json(rows[0]);
    })
)

module.exports = router;