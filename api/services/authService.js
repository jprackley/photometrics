const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const C_AUTH = require("../../utils/constants/cAuth");

const {query} = require("../db");

const isProduction = process.env.NODE_ENV === 'production';

//----------------------------------------------------------------------------------
// JWT Access Token Services
//----------------------------------------------------------------------------------
function getJwtSecret() {
    return process.env.JWT_SECRET || (!isProduction ? 'photometrics-local-dev-secret' : null);
}

function createAccessToken(user) {
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

function verifyAccessToken( accessToken ) {
    try {
        return jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function verifyAccessTokenExpired( accessToken ) {
    try {
        return jwt.verify(accessToken, process.env.JWT_SECRET, {
            ignoreExpiration: true
        });
    } catch (error) {
        return null;
    }
}

//----------------------------------------------------------------------------------
// JWT Refresh Token Services
//----------------------------------------------------------------------------------
function createRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

async function hashRefreshToken(refreshToken) {
    return await bcrypt.hash(refreshToken, C_AUTH.SALT_ROUNDS);
}

async function storeRefreshToken(user, refreshTokenHash) {
    const { rows } = await query(`
        INSERT INTO user_refresh_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING refresh_token_id, user_id, expires_at, created_at;
    `, [
        user.user_id,
        refreshTokenHash,
        new Date(Date.now() + C_AUTH.REFRESH_TOKEN_MAX_AGE_MS)
    ]);

    return rows[0];
}

async function generateRefreshToken(user) {
    const refreshToken = createRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    await storeRefreshToken(user, refreshTokenHash);

    return refreshToken;
}

async function getStoredRefreshTokens() {
    const { rows } = await query(`
        SELECT *
        FROM user_refresh_tokens
        WHERE expires_at > NOW();
    `);

    if (rows.length === 0) { return null; }

    return rows;
}

async function verifyRefreshToken(refreshToken) {
    console.log('[VERIFY REFRESH] Incoming token exists:', Boolean(refreshToken));
    console.log('[VERIFY REFRESH] Incoming token length:', refreshToken?.length);

    if (!refreshToken) {
        return {
            isValid: false,
            refreshToken: null
        };
    }

    const storedRefreshTokenArray = await getStoredRefreshTokens();

    console.log('[VERIFY REFRESH] Active stored token count:', storedRefreshTokenArray?.length || 0);

    if (!storedRefreshTokenArray) {
        return {
            isValid: false,
            refreshToken: null
        };
    }

    for (const storedRefreshToken of storedRefreshTokenArray) {
        const isValidRefreshToken = await bcrypt.compare(
            refreshToken,
            storedRefreshToken.token_hash
        );

        if (isValidRefreshToken) {
            return {
                isValid: true,
                refreshToken: storedRefreshToken
            };
        }
    }

    return {
        isValid: false,
        refreshToken: null
    };
}

async function revokeRefreshTokensByUserID( user ) {
    const result = await query(`
        DELETE FROM user_refresh_tokens
        WHERE user_id = $1;
    `,
        [ user.user_id ]);

    return result.rowCount;
}

//----------------------------------------------------------------------------------
// PostgreSQL query services
//----------------------------------------------------------------------------------
function publicUser(user) {
    const result = {};
    for (const key in user) {
        if (key !== 'password_hash') result[key] = user[key];
    }
    return result;
}

async function getUserByEmail(email) {
    const { rows } = await query(
        `
        SELECT *
        FROM users
        WHERE email = $1;
        `,
        [email]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}

async function updateUserAsLoggedIn(user_id) {
    const {rows} = await query(`
        UPDATE users
        SET last_login = NOW(),
            is_active  = true
        WHERE user_id = $1
        RETURNING *
    `, [user_id]);

    return publicUser( rows[0] ) || null;
}

module.exports = {
    getUserByEmail,
    generateRefreshToken,
    createAccessToken,
    verifyAccessToken,
    verifyAccessTokenExpired,
    verifyRefreshToken,
    revokeRefreshTokensByUserID,
    updateUserAsLoggedIn,
    }