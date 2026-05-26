const express=require("express");
const router = express.Router();

const asyncHandler = require("../../handlers/asyncHandler");
const {validationErrorHandler} = require("../../handlers/expressHandlers");
const { logout } = require("../../controllers/authController");
const {param} = require("express-validator");

router.post('/:id',
    param('id').isUUID().withMessage('Invalid user_id UUID'),
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'LOGOUT User - ');

        res.clearCookie('token');
        res.clearCookie('refresh_token');

        return logout(req, res);
    })
)
module.exports = router;