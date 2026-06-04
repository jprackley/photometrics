const express = require('express');
const router = express.Router();
const {param} = require("express-validator");

const asyncHandler = require('../../../api/handlers/asyncHandler');
const C_HTTP = require("../../../utils/constants/cHTTP");
const {query} = require("../../db");


router.get('/:id',
    [
        param('id').isUUID().withMessage('Invalid Employee UUID')
    ],
    asyncHandler(async (req, res) => {
        const {id} = req.params;
        const result = await query(
            `SELECT * FROM employee_productivity_report WHERE user_id = $1;`
        , [id])

        res.status(C_HTTP.STATUS.OK).json({report: result.rows[0]});
    })
)

module.exports = router;