const express = require('express');
const CONST = require('../utils/cSchema');
const C_HTTP = require('../utils/cHTTP');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../db');
const { body, param} = require("express-validator");
const {handleValidation} = require("../utils/validation");
const hashPassword = require("../utils/hashString");
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
        const hashedPassword = hashPassword(req.body.password_hash);
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
//        READ User             //
//------------------------------//
router.get(
    `/`,
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Users - ');
        const { rows } = await query(`SELECT ${safeUserColumns} FROM users`);
        res.json(rows);
    })
)
router.get(
    `/:id`,
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ User:id - ');
        const { id } = req.params;
        const { rows } = await query(`SELECT ${safeUserColumns} FROM users WHERE user_id = $1`, [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'User ID not found' } });
        res.json(rows[0]);
    })
)

router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE User - ');
        const {id} = req.params;
        const fields = ['first_name', 'last_name', 'email', 'password_hash', 'account_role'];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                if (req.body[f] === 'password_hash') {
                    const hashedPassword = hashPassword(req.body[f]);
                    params.push(hashedPassword);
                }
                else {
                    params.push(req.body[f]);
                    set.push(`${f} = $${params.length}`);
                }
            }
        });
        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json(
            { error: { code: C_HTTP.REASON.BAD_REQUEST, message: 'No updatable fields provided' } });
        params.push(id);
        const sql = `
            UPDATE users SET ${set.join(', ')}
            WHERE user_id = $${params.length}
            RETURNING 
                ${safeUserColumns}
        `
    })
)

module.exports = router;