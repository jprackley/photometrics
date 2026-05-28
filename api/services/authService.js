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

async function storeRefreshToken( user, refreshTokenHash ) {
    await query(`
                    INSERT INTO user_refresh_tokens (
                        user_id,
                        token_hash,
                        expires_at
                    )
                    VALUES ($1, $2, $3)
            `, [user.user_id, refreshTokenHash, new Date(Date.now() + C_AUTH.REFRESH_TOKEN_MAX_AGE_MS)]
    )
}

async function generateRefreshToken( user ) {
    const refreshToken = await createRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    await storeRefreshToken( user, refreshTokenHash );
    return refreshToken;
}

async function getStoredRefreshTokens( user ) {
    const { rows } = await query(`
        SELECT *
        FROM user_refresh_tokens
        WHERE user_id = $1
          AND expires_at > NOW();
    `,
        [ user.user_id ]);

    if (rows.length === 0) { return null; }

    return rows;
}

async function verifyRefreshToken(refreshToken, user) {
    if (!refreshToken || !user?.user_id) {
        return {
            isValid: false,
            refreshToken: null
        };
    }

    const storedRefreshTokenArray = await getStoredRefreshTokens( user )
    if (!storedRefreshTokenArray) {
        return {
            isValid: false,
            refreshToken: null
        };
    } else {
        for (const storedRefreshToken of storedRefreshTokenArray) {
            const isValidRefreshToken = await bcrypt.compare(refreshToken, storedRefreshToken.token_hash);
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
}

async function revokeExpiredRefreshTokensByUserID ( user ) {
    const { result } = await query(`
        DELETE FROM user_refresh_tokens
        WHERE user_id = $1
        AND expires_at < NOW();
    `,
        [ user.user_id ]);

    return result.rowCount;
}

async function revokeRefreshTokensByUserID( user ) {
    const { result } = await query(`
        DELETE FROM user_refresh_tokens
        WHERE user_id = $1;
    `,
        [ user.user_id ]);

    return result.rowCount;
}

async function revokeRefreshTokenByID( storedRefreshToken ) {
    if ( !storedRefreshToken ) { return false; }
    const { result } = await query(`
        DELETE FROM user_refresh_tokens
        WHERE refresh_token_id = $1;
    `,
        [ storedRefreshToken.refresh_token_id ]);

    return result.rowCount;
}

async function rotateRefreshToken( user, storedRefreshToken ) {

    if (await revokeRefreshTokenByID(storedRefreshToken) > 0) {
        return await generateRefreshToken(user);
    } else {
        return null;
    }

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
    getStoredRefreshTokens,
    verifyRefreshToken,
    rotateRefreshToken,
    revokeExpiredRefreshTokensByUserID,
    revokeRefreshTokensByUserID,
    updateUserAsLoggedIn,
    }