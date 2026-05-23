const express = require('express');
const router = express.Router();
const {body} = require("express-validator");
const jwt = require('jsonwebtoken');

const query = require("../../db").query;
const asyncHandler = require("../../../utils/helpers/asyncHandler");
const {handleValidation} = require("../../validators/queryHandler")
const {compare} = require("bcrypt");

const C_HTTP = require("../../../utils/constants/cHTTP");

function getJwtSecret() {
    return process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'photometrics-local-dev-secret' : null);
}

function publicUser(user) {
    const result = {};
    for (const key in user) {
        if (key !== 'password_hash') result[key] = user[key];
    }
    return result;
}

function createToken(user) {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) return null;

    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            account_role: user.account_role,
        },
        jwtSecret,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '2m',
        }
    );
}

async function sendSuccessfulLogin(res, user, authMode = 'database') {
    const token = createToken(user);

    if (!token && process.env.NODE_ENV === 'production') {
        return res.status(C_HTTP.STATUS.INTERNAL_SERVER_ERROR).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR || 500,
                message: 'Login is not configured. Set JWT_SECRET in the server environment.',
            },
        });
    }
    res.cookie('token', token, { maxAge: 1000 * 120, httpOnly: true, secure: true });
    return res.json({ user: publicUser(user), token, authMode });
}

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password_hash').isString().notEmpty().withMessage('Password is required')
    ],
    asyncHandler(async ( req, res ) => {
        handleValidation( req, 'LOGIN User - ');

        const { email, password_hash } = req.body;

        let rows;
        try {
            const result = await query(
                `
                SELECT *
                FROM users
                WHERE email = $1
                `,
                [email]
            );
            rows = result.rows;
        } catch ( dbError ) {
            console.warn( C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR, dbError.message );
            return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
                error: {
                    code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                    message: C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR }
            });
        }

        if (rows.length === 0) {
            console.warn( C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED );
            return res.status( C_HTTP.STATUS.UNAUTHORIZED ).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED }
            });
        }

        const passwordMatches = await compare(
            password_hash,
            rows[0].password_hash
        );

        if (!passwordMatches) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED,
                },
            });
        }

        try {
            await query(`
                    UPDATE users
                    SET last_login = now(),
                        is_active = true
                    WHERE user_id = $1
            `,[rows[0].user_id]);
        } catch (dbError) {
            console.warn( C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR, dbError.message );
            return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
                error: {
                    code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                    message: C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR }
            });
        }

        return sendSuccessfulLogin(res, rows[0]);
    })
);

module.exports = router;
