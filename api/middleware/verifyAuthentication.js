const C_HTTP = require('../../utils/constants/cHTTP');

const { refresh } = require("../controllers/authController");
const {
    verifyAccessToken,
    verifyAccessTokenExpired
} = require("../services/authService");

async function verifyAuthentication(req, res, next) {
    if ( process.env.NODE_ENV === 'test' || 'development' ) return next()

    //Verify the Access Token exists in the request cookies.
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
        console.warn('No Access Token found in the request cookies.')
        return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
            error: {
                code: C_HTTP.CODE.UNAUTHORIZED,
                message: 'No Access Token found in the request cookies.'
            },
        });
    }

    //Test the Access Token to verify it is valid.
    const decodedToken = verifyAccessToken( accessToken );
    if (decodedToken) {
        return next();
    }
    //If the Access Token is invalid, verify its only expired.
    else if (!decodedToken) {
        console.log('Testing if Access Token is invalid or expired.')

        const decodedTokenExpired = verifyAccessTokenExpired( accessToken );
        //If the Access Token is expired, begin a refresh process.
        if (decodedTokenExpired) {
            console.warn('Access Token is expired. Attempting to refresh tokens.')
            return await refresh(req, res);
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

module.exports = {
    verifyAuthentication
};