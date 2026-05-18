const express = require('express');
const router = express.Router();
const C_USER = require('../../utils/constants/cUsers');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_NODE = require('../../utils/constants/cNodeServer');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation, paginate, buildPagination} = require("../../utils/helpers/validation");
const hashPassword = require("../../utils/helpers/hashString");
const { query } = require('../db');
const { body, param} = require("express-validator");
const CU_USER = require("../../utils/constants/cUsers");

//------------------------------//
//        CREATE User           //
//------------------------------//
router.post(
    '/',
    [
        body('employee_id').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.EMPLOYEE_ID,
            max: C_USER.MAX_LENGTH.EMPLOYEE_ID
        }).withMessage(`Employee ID must be less than ${C_USER.MAX_LENGTH.EMPLOYEE_ID} characters long`),

        body('manager_id').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.MANAGER_ID,
            max: C_USER.MAX_LENGTH.MANAGER_ID
        }).withMessage(`Manager ID must be less than ${C_USER.MAX_LENGTH.MANAGER_ID} characters long`),

        body('first_name').isString().isLength({
            min: C_USER.MIN_LENGTH.FIRST_NAME,
            max: C_USER.MAX_LENGTH.FIRST_NAME })
            .withMessage(`First name must be between ${C_USER.MIN_LENGTH.FIRST_NAME} and ${C_USER.MAX_LENGTH.FIRST_NAME} characters`),

        body('middle_name').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.MIDDLE_NAME,
            max: C_USER.MAX_LENGTH.MIDDLE_NAME
        }).withMessage(`Middle name must be less than ${C_USER.MAX_LENGTH.MIDDLE_NAME} characters long`),

        body('last_name').isString().isLength({
            min: C_USER.MIN_LENGTH.LAST_NAME,
            max: C_USER.MAX_LENGTH.LAST_NAME })
            .withMessage(`Last name must be between ${C_USER.MIN_LENGTH.LAST_NAME} and ${C_USER.MAX_LENGTH.LAST_NAME} characters`),

        body('display_name').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.DISPLAY_NAME,
            max: C_USER.MAX_LENGTH.DISPLAY_NAME
        }).withMessage(`Display name must be less than ${C_USER.MAX_LENGTH.DISPLAY_NAME} characters long`),

        body('status').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.STATUS,
            max: C_USER.MAX_LENGTH.STATUS
        }).withMessage(`Status must be less than ${C_USER.MAX_LENGTH.STATUS} characters long`),

        body('email').isEmail().isLength({
            min: C_USER.MIN_LENGTH.EMAIL,
            max: C_USER.MAX_LENGTH.EMAIL })
            .withMessage(`Email must be a valid email address and less than ${C_USER.MAX_LENGTH.EMAIL} characters long`),

        body('phone_number').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.PHONE,
            max: C_USER.MAX_LENGTH.PHONE
        }).withMessage(`Phone Number must be less than ${C_USER.MAX_LENGTH.PHONE} characters long`),

        body('website').optional().isURL().isLength({
            min: C_USER.MIN_LENGTH.WEBSITE,
            max: C_USER.MAX_LENGTH.WEBSITE
        }).withMessage(`Website must be a valid URL and less than ${C_USER.MAX_LENGTH.WEBSITE} characters long`),

        body('notes').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.NOTES,
            max: C_USER.MAX_LENGTH.NOTES
        }).withMessage(`Notes must be less than ${C_USER.MAX_LENGTH.NOTES} characters long`),

        body('address_line1').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.ADDRESS_LINE,
            max: C_USER.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_USER.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('address_line2').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.ADDRESS_LINE,
            max: C_USER.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 2 must bes less than ${C_USER.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('city').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.CITY,
            max: C_USER.MAX_LENGTH.CITY
        }).withMessage(`City must be less than ${CU_USER.MAX_LENGTH.CITY} characters long`),

        body('state').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.STATE,
            max: C_USER.MAX_LENGTH.STATE
        }).withMessage(`State must be less than ${C_USER.MAX_LENGTH.STATE}`),

        body('postal_code').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.POSTAL_CODE,
            max: C_USER.MAX_LENGTH.POSTAL_CODE
        }).withMessage(`Postal Code must be less than ${C_USER.MAX_LENGTH.ZIP} characters long`),

        body('country').optional().isString().isLength({
            min: C_USER.MIN_LENGTH.COUNTRY,
            max: C_USER.MAX_LENGTH.COUNTRY
        }).withMessage(`Country must be less than ${C_USER.MAX_LENGTH.COUNTRY}`),

        body('password_hash').isString().isLength({
            min: C_USER.MIN_LENGTH.PASSWORD, max: C_USER.MAX_LENGTH.PASSWORD })
            .withMessage('Password is invalid or missing'),

        body('account_role').isString().isIn(Object.values(C_USER.ROLES)).withMessage('Invalid account role'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE User - ');
        const hashedPassword = hashPassword(req.body.password_hash);

        const createdColumns = Object.values(C_USER.CREATED_COLUMNS);

        const columns = [];
        const values = [];
        const params = [];

        for (const column of createdColumns) {
            if (req.body[column] !== undefined) {
                columns.push(column);
                params.push(req.body[column]);
                values.push(`$${params.length}`);
            }
        }

        columns.push(C_USER.SECURE_COLUMNS.PASSWORD);
        params.push(hashedPassword);
        values.push(`$${params.length}`);

        const sql = `
            INSERT INTO users (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING ${C_USER.SAFE_RETURN}
        `;
        const { rows } = await query(sql, params);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
);

//------------------------------//
//        READ User             //
//------------------------------//
router.get(
    '/',
    [paginate],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Users - ');
        const {
            all = C_NODE.PAGINATE.ALL,
            page  = C_NODE.PAGINATE.PAGE,
            limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT,
            order = C_NODE.PAGINATE.ORDER,
            q
        } = req.query;

        // if all is true, return all users, otherwise paginate
        if (all === 'true') {
            const sql = `SELECT ${C_USER.SAFE_RETURN} FROM users`;
            const { rows } = await query(sql);
            return res.json(rows);
        }

        //Sets up the pagination variables
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });
        const sortable = C_USER.SAFE_RETURN;

        //Basic whitelist for sort fields to avoid SQL injection
        //Will sort descending by last_name if sort is not a valid column
        const sortField = sortable.includes(String(sort)) ? sort : C_USER.CREATED_COLUMNS.LAST_NAME;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;
        const params = [];
        let where = '';

        //Basic whitelist for sort fields to avoid SQL injection
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} 
            OR email ILIKE $${params.length} OR account_role::text ILIKE $${params.length}`;
        }
        const sql = `
            SELECT ${C_USER.SAFE_RETURN} FROM users
            ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const { rows } = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total FROM users ${where}`;
        const { rows: countRows } = await query(countSql, q ? [params[0]] : []);

        res.json({ data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total });
    })
);
router.get(
    `/:id`,
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ User:id - ');
        const { id } = req.params;
        const { rows } = await query(`SELECT ${C_USER.SAFE_RETURN} FROM users WHERE user_id = $1`, [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'User ID not found' } });
        res.json(rows[0]);
    })
)
//--------------------------------//
//        UPDATE User             //
//--------------------------------//
router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE User - ');
        const {id} = req.params;
        const fields = ['first_name', 'last_name', 'email', 'password_hash', 'account_role'];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                if (req.body[f] === 'password_hash') {
                    const hashedPassword = hashPassword(req.body[f]);
                    params.push(hashedPassword);
                }
                else {
                    params.push(req.body[f]);
                    set.push(`${f} = $${params.length}`);
                }
            }
        });
        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json(
            { error: { code: C_HTTP.REASON.BAD_REQUEST, message: 'No updatable fields provided' } });
        params.push(id);
        const sql = `
            UPDATE users SET ${set.join(', ')}, updated_at = now()
            WHERE user_id = $${params.length}
            RETURNING ${C_USER.SAFE_RETURN}
        `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'User not found' } });
        res.json(rows[0]);
    })
)
//--------------------------------//
//        DELETE User             //
//--------------------------------//

router.delete(
    '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE User - ');
        const { id } = req.params;
        const { rowCount } = await query('DELETE FROM users WHERE user_id = $1', [id]);
        if (rowCount === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'User not found' } });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)

module.exports = router;