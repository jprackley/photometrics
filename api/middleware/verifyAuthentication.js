const C_HTTP = require('../../utils/constants/cHTTP')
const jwt = require("jsonwebtoken");

const isTokenRequired = process.env.JWT_TOKEN_ENABLED === 'true';
const isProduction = process.env.NODE_ENV === 'production';

async function verifyAuthentication(req, res, next) {
    if ( !isTokenRequired && !isProduction ) {
        console.warn(`[AUTH] Server authentication requires the .env file to be correctly configured. 
        Verify JWT_TOKEN_ENABLED=true and NODE_ENV=production`);
        return next();
    }
    console.log('[AUTH] Verifying JWT_TOKEN_ENABLED');
    const token = req.cookies?.token;
    const refreshToken = req.cookies?.refresh_token;

    if (!token) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: C_HTTP.MESSAGE.AUTH.UNAUTHORIZED
            }
        });
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log(JSON.stringify(decodedToken));
        return next();

    } catch (err) {
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: err.message,
                details: err.details,
            }
        });
    }
}

module.exports = {
    verifyAuthentication,
}