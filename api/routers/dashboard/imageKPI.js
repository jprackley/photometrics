const express = require('express');
const router = express.Router();

const C_IMAGE = require('../../../utils/constants/cImages');

const asyncHandler = require('../../../utils/helpers/asyncHandler');
const { verbose } = require('../../expressHandlers');
const {validationErrorHandler} = require("../../expressHandlers");
const { query } = require("../../db");

router.get(
    '/active',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Active Images - ');
        const { v } = req.query;
        let activeImages = {
            active: 0,
            images: {}
        }
        const params = [C_IMAGE.STATUS.IN_PROGRESS]
        const isAcitveSQL = `
            SELECT *
            FROM images
            WHERE completed_at IS NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isAcitveSQL, params);

        activeImages.active = rows.length;
        if ( v === 'true' ) {
            activeImages.images = rows;
        }

        res.json(activeImages);
    })
)
router.get(
    '/completed',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Completed Images - ');
        const { v } = req.query;
        let completedImages = {
            completed: 0,
            images: {}
        }
        const params = [C_IMAGE.STATUS.COMPLETED]
        const isCompletedSQL = `
            SELECT *
            FROM images
            WHERE completed_at IS NOT NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isCompletedSQL, params);

        completedImages.completed = rows.length;
        if ( v === 'true' ) {
            completedImages.images = rows;
        }

        res.json(completedImages);
    })
)
router.get(
    '/remaining',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Remaining Images - ');
        const { v } = req.query;
        let remainingImages = {
            remaining: 0,
            images: {}
        }
        const params = [C_IMAGE.STATUS.PENDING]
        const isRemainingSQL = `
            SELECT *
            FROM images
            WHERE completed_at IS NULL
              AND status::TEXT = $1;
        `
        const { rows } = await query(isRemainingSQL, params);

        remainingImages.remaining = rows.length;
        if ( v === 'true' ) {
            remainingImages.images = rows;
        }

        res.json(remainingImages);
    })
)
router.get(
    '/total',
    [verbose],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'GET Total Images - ');
        const { v } = req.query;
        let totalImages = {
            total: 0,
            images: {}
        }
        const isTotalSQL = `
            SELECT *
            FROM images
        `
        const { rows } = await query(isTotalSQL);

        totalImages.total = rows.length;
        if ( v === 'true' ) {
            totalImages.images = rows;
        }

        res.json(totalImages);
    })
)

module.exports = router;