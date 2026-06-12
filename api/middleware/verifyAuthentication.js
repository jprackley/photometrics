const C_HTTP = require('../../utils/constants/cHTTP');

const { refreshAccessToken } = require("../controllers/authController");
const {
    verifyAccessToken,
    verifyAccessTokenExpired,
} = require("../services/authService");

async function verifyAuthentication(req, res, next) {
    if (
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'development'
    ) {
        return next();
    }

    //Verify the Access Token exists in the request cookies.
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
        console.warn('No Access Token found in the request cookies.')
        const newAccessToken = await refreshAccessToken( req, res );
        if (newAccessToken) {
            return next();
        }
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'Access and Refresh Token are invalid or expired.'
            },
        });
    }

    //Test the Access Token to verify it is valid.
    const decodedToken = verifyAccessToken( accessToken );

    if (decodedToken) {
        console.warn('Access Token is valid. Proceeding to next middleware.');
        return next();
    }
    //If the Access Token is invalid, verify its only expired.
    else if (!decodedToken) {
        console.warn('Testing if Access Token is invalid or expired.')

        const decodedTokenExpired = verifyAccessTokenExpired( accessToken );
        //If the Access Token is expired, begin a refresh process.
        if (decodedTokenExpired) {
            console.warn('Access Token is expired. Attempting to refresh tokens.')
            const refreshed = await refreshAccessToken(req, res);

            if (refreshed) {
                return next();
            }
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: 'Access and Refresh Token are invalid or expired.'
                },
            });
        }
        //If the Access Token is invalid for any other reason, the user is not authenticated.
        else if (!decodedTokenExpired) {
            console.warn('Access and Refresh Token are invalid or expired.')
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: 'Access and Refresh Token are invalid or expired.'
                },
            });
        }
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const accessToken = req.cookies?.access_token;
        const decodedToken = verifyAccessToken( accessToken );

        if (!accessToken || !decodedToken) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Failed to decyrypt Access Token. Please login again.',
                },
            });
        }

        const userRole = decodedToken.account_role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(C_HTTP.STATUS.FORBIDDEN).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to access this resource.',
                },
            });
        }

        next();
    };
}

module.exports = {
    verifyAuthentication,
    requireRole,
};