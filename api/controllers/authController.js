const C_HTTP = require("../../utils/constants/cHTTP");
const {query} = require("../db");
const {compare} = require("bcrypt");
const C_AUTH = require("../../utils/constants/cAuth");
const {
    getUserByEmail,
    updateUserAsLoggedIn,
    generateRefreshToken,
    createAccessToken,
    verifyRefreshToken,
    rotateRefreshToken,
} = require("../services/authService");
const crypto = require("crypto");

function tokenFingerprint(token) {
    if (!token) return null;

    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
        .slice(0, 16);
}

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
    path: '/',
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
        const accessToken = createAccessToken(updatedUser);
        const refreshToken = await generateRefreshToken(updatedUser);

        res.cookie(
            'access_token',
            accessToken,
            accessCookieOptions
        );
        res.cookie(
            'refresh_token',
            refreshToken,
            refreshCookieOptions
        );

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

async function refresh(req, res, next) {
    const refreshToken = req.cookies?.refresh_token;

    console.log('[REFRESH] Raw cookie header:', req.headers.cookie);
    console.log('[REFRESH] Parsed cookies:', req.cookies);
    console.log('[REFRESH] Refresh cookie fingerprint:', tokenFingerprint(refreshToken));

    const result = await verifyRefreshToken(refreshToken);

    console.log('[REFRESH] Verify result:', {
        isValid: result.isValid,
        hasRefreshTokenRow: Boolean(result.refreshToken),
        userId: result.refreshToken?.user_id,
        refreshTokenId: result.refreshToken?.refresh_token_id,
    });

    if (!result.isValid || !result.refreshToken) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'Failed to refresh tokens. Please login again.',
            },
        });
    }

    const user = {
        user_id: result.refreshToken.user_id,
    };

    const accessToken = createAccessToken(user);
    const newRefreshToken = await rotateRefreshToken(user, result.refreshToken);

    console.log('[REFRESH] New refresh token fingerprint:', tokenFingerprint(newRefreshToken));

    res.cookie('access_token', accessToken, accessCookieOptions);
    res.cookie('refresh_token', newRefreshToken, refreshCookieOptions);

    return next();
}

module.exports = {
    login,
    logout,
    refresh,
    }