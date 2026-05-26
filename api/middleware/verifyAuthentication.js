const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const C_HTTP = require('../../utils/constants/cHTTP');
const { query } = require('../db');

function rejectUnauthorized(res, message = 'Unauthorized') {
    return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
        error: {
            code: C_HTTP.CODE.UNAUTHORIZED,
            message
        }
    });
}

async function getStoredRefreshTokens(user_id) {
    const { rows } = await query(
        `
        SELECT
            user_id,
            token_hash,
            expires_at,
            revoked_at
        FROM user_refresh_tokens
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW();
        `,
        [user_id]
    );

    return rows;
}

async function verifyRefreshToken(user_id, refreshToken) {
    const storedRefreshTokens = await getStoredRefreshTokens(user_id);

    if (storedRefreshTokens.length === 0) {
        return false;
    }

    for (const storedRefreshToken of storedRefreshTokens) {
        const isValidRefreshToken = await bcrypt.compare(
            refreshToken,
            storedRefreshToken.token_hash
        );

        if (isValidRefreshToken) {
            return true;
        }
    }

    return false;
}

async function verifyExpiredAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, {
            ignoreExpiration: true
        });
    } catch (error) {
        return null;
    }
}

async function verifyAuthentication(req, res, next) {
    const accessToken = req.cookies?.token;
    const refreshToken = req.cookies?.refresh_token;

    if (!accessToken && !refreshToken) {
        return rejectUnauthorized(res, 'Access token or refresh token is required');
    }

    if (accessToken) {
        try {
            const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);

            req.user = {
                user_id: decodedToken.user_id,
                email: decodedToken.email,
                account_role: decodedToken.account_role
            };

            return next();

        } catch (error) {
            if (!refreshToken) {
                return rejectUnauthorized(res, 'Invalid access token and no refresh token was provided');
            }

            if (error.name !== 'TokenExpiredError') {
                return rejectUnauthorized(res, 'Invalid access token');
            }

            const expiredDecodedToken = await verifyExpiredAccessToken(accessToken);

            if (!expiredDecodedToken?.user_id) {
                return rejectUnauthorized(res, 'Could not verify expired access token');
            }

            const validRefreshToken = await verifyRefreshToken(
                expiredDecodedToken.user_id,
                refreshToken
            );

            if (!validRefreshToken) {
                return rejectUnauthorized(res, 'Invalid refresh token');
            }

            req.user = {
                user_id: expiredDecodedToken.user_id,
                email: expiredDecodedToken.email,
                account_role: expiredDecodedToken.account_role
            };

            return refresh(req, res, next);
        }
    }

    return rejectUnauthorized(res, 'Access token is required');
}

module.exports = {
    verifyAuthentication
};