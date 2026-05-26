const jwt = require('jsonwebtoken');
const C_HTTP = require("../../utils/constants/cHTTP");
const {query} = require("../db");
const {compare} = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const {
    getUserByEmail,
    updateUserAsLoggedIn,
} = require("../services/authService");

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: C_AUTH.TOKEN_MAX_AGE_MS,
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: C_AUTH.REFRESH_TOKEN_MAX_AGE_MS,
};

async function login(req, res) {

    const { email, password_hash } = req.body;

    //Attempt to retieve the user from the database.
    try {
        const user = await getUserByEmail( email );

        //Verify if the database responded with a matched user.
        if (!user) {
            console.warn( C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED );
            return res.status( C_HTTP.STATUS.UNAUTHORIZED ).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED }
            });
        }

        //Verifies the password provided by the user.
        const passwordMatches = await compare(
            password_hash,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED,
                },
            });
        }

        const updatedUser = await updateUserAsLoggedIn(user.user_id);

        return res.status(C_HTTP.STATUS.OK).json({ user: updatedUser });
    }

    //Catches an error passed from the database or the pool connection.
    catch ( dbError ) {
        console.warn( C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR, dbError.message );
        return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                message: C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR }
        });
    }
}

async function logout(req, res) {
    const { id } = req.params;
    console.log(`[LOGOUT] User ${id} has requested logged out.`);

    try {
        const {rows} = await query(`
            UPDATE users SET is_active = false
            WHERE user_id = $1
            RETURNING
                user_id,
                first_name,
                last_name,
                email,
                account_role,
                is_active,
                last_login;
            `, [id]);

        if (rows.length === 0) {
            console.warn(`[LOGOUT] User ${id} logout query failed to return row.`);
            return res.status(C_HTTP.STATUS.INTERNAL_SERVER_ERROR).json({
                error: {
                    code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                    message: C_HTTP.MESSAGE.LOGOUT.INTERNAL_SERVER_ERROR
                }
            });
        }
        console.log(`[LOGOUT] User ${rows[0].email} has logged out.`);
        return res.status(C_HTTP.STATUS.OK).json({ user: rows[0] });

    } catch (error) {
        console.warn(`[LOGOUT] User ${id} logout query failed. Error: ${error.message}`);
        return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                message: C_HTTP.MESSAGE.LOGOUT.INTERNAL_SERVER_ERROR,
                details: error.message }
        });
    }
}

async function refresh(req, res) {

    const refreshToken = req.cookies?.refresh_token;
    //Verify if the refresh token is present in the request.
    if (!refreshToken) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'Refresh token is required'
            }
        });
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'Invalid or expired refresh token'
            }
        });
    }

    const sql = `
        SELECT user_id, email, account_role
        FROM users
        WHERE user_id = $1;
    `;

    const {rows} = await query(sql, [decodedToken.user_id]);

    if (rows.length === 0) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'User no longer exists'
            }
        });
    }

    const user = rows[0];

    const newAccessToken = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            account_role: user.account_role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
    );

    res.cookie('token', newAccessToken, accessCookieOptions);

    return res.status(C_HTTP.STATUS.OK).json({
        message: 'Access token refreshed'
    });
}

module.exports = {
    login,
    logout,
    refresh,
    }