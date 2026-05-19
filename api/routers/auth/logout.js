const express=require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/helpers/asyncHandler");
const {handleValidation} = require("../../../utils/helpers/validation");
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");

router.post('/:id',
    param('id').isUUID().withMessage('Invalid user_id UUID'),
    asyncHandler(async (req, res) => {
        handleValidation(req, 'LOGOUT User - ');

        const sql = `
        UPDATE users SET is_active = false
        WHERE user_id = $1
        RETURNING user_id, is_active;
        `
        const {rows} = await query(sql, [req.params.id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({error: {code: C_HTTP.CODE.NOT_FOUND, message: C_HTTP.MESSAGE.LOGOUT.NOT_FOUND}});

        res.status(C_HTTP.STATUS.OK).json({message: C_HTTP.MESSAGE.LOGOUT.OK});
    })
)
module.exports = router;