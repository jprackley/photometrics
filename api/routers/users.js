const express = require('express');
const CONST = require('../utils/constants');
const C_HTTP = require('../utils/httpStatus');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../db');
const { body, param} = require("express-validator");
const {handleValidation} = require("../utils/validation");
const crypto = require("node:crypto");
const router = express.Router();

const safeUserColumns = `
    user_id,
    first_name,
    last_name,
    email,
    last_login,
    created_at,
    updated_at,
    account_role`;


//------------------------------//
//        CREATE User           //
//------------------------------//
router.post(
    '/',
    [
        body('first_name').isString().isLength({ min: CONST.MIN.FIRST_NAME_LENGTH, max: CONST.MAX.FIRST_NAME_LENGTH })
            .withMessage(`First name must be between ${CONST.MIN.FIRST_NAME_LENGTH} and ${CONST.MAX.FIRST_NAME_LENGTH} characters`),
        body('last_name').isString().isLength({ min: CONST.MIN.LAST_NAME_LENGTH, max: CONST.MAX.LAST_NAME_LENGTH })
            .withMessage(`Last name must be between ${CONST.MIN.LAST_NAME_LENGTH} and ${CONST.MAX.LAST_NAME_LENGTH} characters`),
        body('email').isEmail().isLength({ max: CONST.MAX.EMAIL_LENGTH }).withMessage('Invalid email format'),
        body('password_hash').isString().withMessage('Password is invalid or missing'),
        body('account_role').isString().isIn(CONST.USER_ROLES).withMessage('Invalid account role'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE User - ');
        console.log("Encrypting secrets....");
        const hashedPassword = crypto
            .createHash("sha256")
            .update(req.body.password_hash)
            .digest("hex");
        const { first_name, last_name, email, account_role } = req.body;

        const sql = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING 
                user_id,
                first_name,
                last_name,
                email,
                last_login,
                created_at,
                updated_at,
                account_role
        `;
        const { rows } = await query(sql, [first_name, last_name, email, hashedPassword, account_role ]);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
);

//------------------------------//
//        READ User           //
//------------------------------//
router.get(
    `/id`,
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ User:id - ');
        const { id } = req.params;
        const { rows } = await query(`SELECT ${safeUserColumns} FROM users WHERE user_id = $1`, [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'User ID not found' } });
        res.json(rows[0]);
    })
)

module.exports = router;