const express = require('express');
const router = express.Router();
const {body} = require("express-validator");

const asyncHandler = require("../../handlers/asyncHandler");
const {validationErrorHandler} = require("../../handlers/expressHandlers")

const {login} = require("../../controllers/authController")
const {verifyAuthentication} = require("../../middleware/verifyAuthentication");

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password_hash').isString().notEmpty().withMessage('Password is required')
    ],
    asyncHandler(async ( req, res ) => {
        validationErrorHandler( req, 'LOGIN User - ');

        return await login(req, res);
    })
);

module.exports = router;
