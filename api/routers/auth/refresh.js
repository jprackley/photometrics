const express = require('express');

const asyncHandler = require('../../handlers/asyncHandler');

const C_HTTP = require('../../../utils/constants/cHTTP');

const router = express.Router();

router.post(
    '/',
    asyncHandler(async (req, res) => {
        return res.status(C_HTTP.STATUS.OK);
    })
);

module.exports = router;