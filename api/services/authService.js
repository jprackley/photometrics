const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const C_AUTH = require("../../utils/constants/cAuth");
const {query} = require("../db");

const isProduction = process.env.NODE_ENV === 'production';

//----------------------------------------------------------------------------------
// JWT Services
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

async function verifyRefreshToken( refreshToken, storedRefreshToken) {
    return await bcrypt.compare(refreshToken, storedRefreshToken);
}

async function getStoredRefreshToken( user ) {
    const { rows } = await query(`
        SELECT token_hash
        FROM user_refresh_tokens
        WHERE user_id = $1
    `, [ user.user_id ]);

    if (rows.length === 0) { return null; }

    return rows[0].token_hash;
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
    verifyRefreshToken,
    getStoredRefreshToken,
    updateUserAsLoggedIn,
    }