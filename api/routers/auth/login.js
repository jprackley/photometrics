const express = require('express');
const router = express.Router();
const {body} = require("express-validator");
const jwt = require('jsonwebtoken');

const query = require("../../db").query;
const asyncHandler = require("../../../utils/helpers/asyncHandler");
const {handleValidation} = require("../../../utils/helpers/validation")
const {compare} = require("bcrypt");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password_hash').isString().notEmpty().withMessage('Password is required')
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'LOGIN User - ');

        const { email, password_hash } = req.body;

        const { rows } = await query(
            `
            SELECT *
            FROM users
            WHERE email = $1
            `,
            [email]
        );
        //If the user is not found, return an error
        if (rows.length === 0) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED,
                },
            });
        }
        //Compare the provided password with the hashed password in the database
        const passwordMatches = await compare(
            password_hash,
            rows[0].password_hash
        );
        //If the password does not match, return an error
        if (!passwordMatches) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED,
                },
            });
        }
        // If the password matches, generate a JWT token.
        // JWT_SECRET is required outside local development so deployed auth does not silently use a weak secret.
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'photometrics-local-dev-secret' : null);
        if (!jwtSecret) {
            return res.status(C_HTTP.STATUS.INTERNAL_SERVER_ERROR).json({
                error: {
                    code: C_HTTP.CODE.INTERNAL_SERVER_ERROR || 500,
                    message: 'Login is not configured. Set JWT_SECRET in the server environment.',
                },
            });
        }

        const token = jwt.sign(
            {
                user_id: rows[0].user_id,
                email: rows[0].email,
                account_role: rows[0].account_role,
            },
            jwtSecret,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            }
        );
        //Return the user object and the JWT token in the response
        //Remove the password_hash field from the user object before sending it to the client
        let user = {};
        for (const key in rows[0]) {
            if (key !== 'password_hash') {
                user[key] = rows[0][key];
            }
        }
        await query(`
                    UPDATE users
                    SET last_login = now(),
                        is_active = true
                    WHERE user_id = $1
            `,[rows[0].user_id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.MESSAGE.NOT_FOUND, message: 'User Status Update Failed' } });

        res.json({ user, token });
    })
);

module.exports = router;