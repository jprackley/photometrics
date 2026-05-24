const express = require('express');
const router = express.Router();
const {body} = require("express-validator");

const query = require("../../db").query;
const asyncHandler = require("../../handlers/asyncHandler");
const {validationErrorHandler} = require("../../handlers/expressHandlers")

const {login} = require("../../controllers/authController")
const {compare} = require("bcrypt");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password_hash').isString().notEmpty().withMessage('Password is required')
    ],
    asyncHandler(async ( req, res ) => {
        validationErrorHandler( req, 'LOGIN User - ');

        const { email, password_hash } = req.body;
        let rows;

        try { //Attempt to retieve the user from the database.
            const result = await query(
                `
                SELECT *
                FROM users
                WHERE email = $1
                `,
                [email]
            );
            rows = result.rows;
        } catch ( dbError ) { //Catches an error passed from the database or the pool connection.
            console.warn( C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR, dbError.message );
            return res.status( C_HTTP.STATUS.INTERNAL_SERVER_ERROR ).json({
                error: {
                    code: C_HTTP.CODE.INTERNAL_SERVER_ERROR,
                    message: C_HTTP.MESSAGE.LOGIN.INTERNAL_SERVER_ERROR }
            });
        }
        if (rows.length === 0) { //Verifys if the database responded with a matched user.
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
            rows[0].password_hash
        );

        if (!passwordMatches) {
            return res.status(C_HTTP.STATUS.UNAUTHORIZED).json({
                error: {
                    code: C_HTTP.CODE.UNAUTHORIZED,
                    message: C_HTTP.MESSAGE.LOGIN.UNAUTHORIZED,
                },
            });
        }

        return login(res, rows[0]);
    })
);

module.exports = router;
