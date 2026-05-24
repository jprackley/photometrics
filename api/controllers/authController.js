const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const C_HTTP = require("../../utils/constants/cHTTP");
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../db");

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: C_AUTH.TOKEN_MAX_AGE_MS,
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: C_AUTH.REFRESH_TOKEN_MAX_AGE_MS,
};

function getJwtSecret() {
    return process.env.JWT_SECRET || (!isProduction ? 'photometrics-local-dev-secret' : null);
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
            expiresIn: process.env.JWT_EXPIRES_IN || '10m',
        }
    );
}

function createRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(refreshToken) {
    return crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
}

async function login(res, user, authMode = 'database') {
    const accessToken = createToken(user);
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    //A catch to ensure the production enviroment is generating tokens.
    if (!accessToken && !refreshTokenHash && process.env.NODE_ENV === 'production') {
        return res.status(C_HTTP.STATUS.INTERNAL_SERVER_ERROR).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR || 500,
                message: 'Login is not configured. Set JWT_SECRET in the server environment.',
            },
        });
    }

    try {
        //Attempts to put the refresh token in the database.
        await query(`
                    INSERT INTO user_refresh_tokens (
                        user_id,
                        token_hash,
                        expires_at
                    )
                    VALUES ($1, $2, $3)
        `, [user.user_id, refreshTokenHash, new Date(Date.now() + C_AUTH.REFRESH_TOKEN_MAX_AGE_MS)]
        )
        //Attempts to update the user as logged in.

        const { rows } = await query(`
            UPDATE users
            SET last_login = now(),
                is_active = true
            WHERE user_id = $1
            RETURNING
                user_id,
                first_name,
                last_name,
                email,
                account_role,
                is_active,
                last_login
        `, [user.user_id]);

        user = rows[0];

    } catch (dbError) {
        console.warn( C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR, dbError.message );
        return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                message: C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR }
        });
    }

    res.cookie('token', accessToken, accessCookieOptions);
    res.cookie('refresh_token', refreshToken, refreshCookieOptions);
    return res.json({ user, authMode });
}

async function logout(req, res) {
    const { id } = req.params;

    try {
        const sql = `
        UPDATE users SET is_active = false
        WHERE user_id = $1
        RETURNING *;
        `
        const {rows} = await query(sql, id);

        if (rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({
                error: {
                    code: C_HTTP.CODE.NOT_FOUND,
                    message: C_HTTP.MESSAGE.LOGOUT.NOT_FOUND
                }
            });
        }

        res.cookie.remove('token');
        res.cookie.remove('refresh_token');
        return res.status(C_HTTP.STATUS.OK).json({ user: publicUser(rows[0]) })

    } catch {
        console.warn( C_HTTP.MESSAGE.LOGOUT.INTERNAL_SERVER_ERROR, dbError.message );
        return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
            error: {
                code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                message: C_HTTP.MESSAGE.LOGOUT.INTERNAL_SERVER_ERROR }
        });
    }
}

module.exports = {
    login,
    logout,
    publicUser
}