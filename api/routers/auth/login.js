const express = require('express');
const router = express.Router();
const {body} = require("express-validator");
const query = require("../../db").query;

const asyncHandler = require("../../../utils/helpers/asyncHandler");
const handleValidation = require("../../../utils/helpers/validation")
const {compare} = require("bcrypt");

router.post(
    '/login',
    [
        body('email').isEmail(),
        body('password').isString().notEmpty(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'LOGIN User - ');

        const { email, password } = req.body;

        const { rows } = await query(
            `
            SELECT
                user_id,
                first_name,
                last_name,
                email,
                password_hash,
                account_role
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: {
                    code: 'Unauthorized',
                    message: 'Invalid email or password',
                },
            });
        }

        const user = rows[0];

        const passwordMatches = await compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: {
                    code: 'Unauthorized',
                    message: 'Invalid email or password',
                },
            });
        }

        res.json({
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            account_role: user.account_role,
        });
    })
);

module.exports = router;