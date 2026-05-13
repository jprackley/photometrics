const express = require('express');
const CONST = require('../utils/constants');
const {body} = require("express-validator");
const router = express.Router();

// CREATE CLient
router.post(
    '/',
    [
        body('first_name').isString().isLength({ min: CONST.MIN.FIRST_NAME_LENGTH, max: CONST.MAX.FIRST_NAME_LENGTH }),
        body('last_name').isString().isLength({ min: CONST.MIN.LAST_NAME_LENGTH, max: CONST.MAX.LAST_NAME_LENGTH }),
        body('email').isEmail().isLength({ max: CONST.MAX.EMAIL_LENGTH }),
        body('password_hash').isString(),
        body('account_role').isString().isIn(CONST.USER_ROLES),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req);
        const { first_name, last_name, company_name, email } = req.body;

        const sql = `
      INSERT INTO users (first_name, last_name, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const { rows } = await query(sql, [first_name, last_name, company_name, email]);
        res.status(201).json(rows[0]);
    })
);

module.exports = router;