const express = require('express');
const { body, param} = require("express-validator");
const router = express.Router();

const bcrypt = require('bcrypt');
const C_AUTH = require('../../utils/constants/cAuth');

const C_USER = require('../../utils/constants/cUsers');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_NODE = require('../../utils/constants/cNodeServer');

const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation, paginate, buildPagination} = require("../../utils/helpers/validation");
const { query } = require('../db');
const {MESSAGE} = require("../../utils/constants/cHTTP");

//----------------------------------------------------------------------------------
// Create Users
//----------------------------------------------------------------------------------
router.post(
    '/',
    [
        body('employee_id').optional().isString().isLength({
            min: C_USER.MIN.EMPLOYEE_ID,
            max: C_USER.MAX.EMPLOYEE_ID
        }).withMessage(`Employee ID must be less than ${C_USER.MAX.EMPLOYEE_ID} characters long`),

        body('manager_id').optional().isString().isLength({
            min: C_USER.MIN.MANAGER_ID,
            max: C_USER.MAX.MANAGER_ID
        }).withMessage(`Manager ID must be less than ${C_USER.MAX.MANAGER_ID} characters long`),

        body('first_name').isString().isLength({
            min: C_USER.MIN.FIRST_NAME,
            max: C_USER.MAX.FIRST_NAME })
            .withMessage(`First name must be between ${C_USER.MIN.FIRST_NAME} and ${C_USER.MAX.FIRST_NAME} characters`),

        body('middle_name').optional().isString().isLength({
            min: C_USER.MIN.MIDDLE_NAME,
            max: C_USER.MAX.MIDDLE_NAME
        }).withMessage(`Middle name must be less than ${C_USER.MAX.MIDDLE_NAME} characters long`),

        body('last_name').isString().isLength({
            min: C_USER.MIN.LAST_NAME,
            max: C_USER.MAX.LAST_NAME })
            .withMessage(`Last name must be between ${C_USER.MIN.LAST_NAME} and ${C_USER.MAX.LAST_NAME} characters`),

        body('display_name').optional().isString().isLength({
            min: C_USER.MIN.DISPLAY_NAME,
            max: C_USER.MAX.DISPLAY_NAME
        }).withMessage(`Display name must be less than ${C_USER.MAX.DISPLAY_NAME} characters long`),

        body('status').optional().isString().isLength({
            min: C_USER.MIN.STATUS,
            max: C_USER.MAX.STATUS
        }).withMessage(`Status must be less than ${C_USER.MAX.STATUS} characters long`),

        body('email').isEmail().isLength({
            min: C_USER.MIN.EMAIL,
            max: C_USER.MAX.EMAIL })
            .withMessage(`Email must be a valid email address and less than ${C_USER.MAX.EMAIL} characters long`),

        body('phone_number').optional().isString().isLength({
            min: C_USER.MIN.PHONE,
            max: C_USER.MAX.PHONE
        }).withMessage(`Phone Number must be less than ${C_USER.MAX.PHONE} characters long`),

        body('website').optional().isURL().isLength({
            min: C_USER.MIN.WEBSITE,
            max: C_USER.MAX.WEBSITE
        }).withMessage(`Website must be a valid URL and less than ${C_USER.MAX.WEBSITE} characters long`),

        body('notes').optional().isString().isLength({
            min: C_USER.MIN.NOTES,
            max: C_USER.MAX.NOTES
        }).withMessage(`Notes must be less than ${C_USER.MAX.NOTES} characters long`),

        body('address_line1').optional().isString().isLength({
            min: C_USER.MIN.ADDRESS_LINE,
            max: C_USER.MAX.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_USER.MAX.ADDRESS_LINE} characters long`),

        body('address_line2').optional().isString().isLength({
            min: C_USER.MIN.ADDRESS_LINE,
            max: C_USER.MAX.ADDRESS_LINE
        }).withMessage(`Address line 2 must bes less than ${C_USER.MAX.ADDRESS_LINE} characters long`),

        body('city').optional().isString().isLength({
            min: C_USER.MIN.CITY,
            max: C_USER.MAX.CITY
        }).withMessage(`City must be less than ${C_USER.MAX.CITY} characters long`),

        body('state').optional().isString().isLength({
            min: C_USER.MIN.STATE,
            max: C_USER.MAX.STATE
        }).withMessage(`State must be less than ${C_USER.MAX.STATE}`),

        body('postal_code').optional().isString().isLength({
            min: C_USER.MIN.POSTAL_CODE,
            max: C_USER.MAX.POSTAL_CODE
        }).withMessage(`Postal Code must be less than ${C_USER.MAX.ZIP} characters long`),

        body('country').optional().isString().isLength({
            min: C_USER.MIN.COUNTRY,
            max: C_USER.MAX.COUNTRY
        }).withMessage(`Country must be less than ${C_USER.MAX.COUNTRY} characters long`),

        body('password_hash').isString().isLength({
            min: C_USER.MIN.PASSWORD, max: C_USER.MAX.PASSWORD })
            .withMessage(`Password must be between ${C_USER.MIN.PASSWORD} and ${C_USER.MAX.PASSWORD} characters long`),

        body('account_role').isString().isIn(Object.values(C_USER.ROLES))
            .withMessage('Invalid account role. Must be one of: ' + Object.values(C_USER.ROLES).join(',')),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE User - ');

        const hashedPassword = await bcrypt.hash(req.body.password_hash, C_AUTH.SALT_ROUNDS);

        const createdColumns = [
            ...Object.values(C_USER.REQUIRED_COLUMNS),
            ...Object.values(C_USER.MUTABLE_COLUMNS),
            C_USER.SECURE_COLUMNS.PASSWORD
        ];

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
//----------------------------------------------------------------------------------
// READ User with pagination
//  - all: true will return all clients
//  - all: false will return paginated results
//  - page: page number
//  - limit: number of results per page
//  - sort: column to sort by
//  - order: ascending or descending
//  - q: search query
//----------------------------------------------------------------------------------
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
        const sortable = [
            ...Object.values(C_USER.REQUIRED_COLUMNS),
            ...Object.values(C_USER.MUTABLE_COLUMNS)
        ];

        //Basic whitelist for sort fields to avoid SQL injection
        //Will sort descending by last_name if sort is not a valid column
        const sortField = sortable.includes(String(sort)) ? sort : C_USER.REQUIRED_COLUMNS.LAST_NAME;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;
        const params = [];
        let where = '';

        //Basic whitelist for sort fields to avoid SQL injection
        if (q) {
            params.push(`%${q}%`);
            where = `
            WHERE first_name ILIKE $${params.length} 
            OR middle_name ILIKE $${params.length}
            OR last_name ILIKE $${params.length} 
            OR display_name ILIKE $${params.length}
            OR title ILIKE $${params.length}
            OR company ILIKE $${params.length}
            OR department ILIKE $${params.length}
            OR location ILIKE $${params.length} 
            OR status ILIKE $${params.length}
            OR email ILIKE $${params.length} 
            OR phone_number ILIKE $${params.length}
            OR website ILIKE $${params.length}
            OR notes ILIKE $${params.length}
            OR address_line1 ILIKE $${params.length}
            OR address_line2 ILIKE $${params.length}
            OR city ILIKE $${params.length}
            OR state ILIKE $${params.length}
            OR postal_code ILIKE $${params.length}
            OR country ILIKE $${params.length}
            OR account_role::text ILIKE $${params.length}`;
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
//----------------------------------------------------------------------------------
// READ User:id
//----------------------------------------------------------------------------------
router.get(
    `/:id`,
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ User:id - ');
        const { id } = req.params;
        const { rows } = await query(`SELECT ${C_USER.SAFE_RETURN} FROM users WHERE user_id = $1`, [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message:  C_HTTP.MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// PATCH User:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE User - ');
        const {id} = req.params;
        const fields = [
            ...Object.values(C_USER.REQUIRED_COLUMNS),
            ...Object.values(C_USER.MUTABLE_COLUMNS),
            C_USER.SECURE_COLUMNS.PASSWORD
        ];
        const set = [];
        const params = [];

        for (const f of fields) {
            if (req.body[f] != null) {
                console.log(`The Field is: ${f} The Expected Field is: ${req.body[f]}`);
                if (f === 'password_hash') {
                    const hashedPassword = await bcrypt.hash(req.body.password_hash, C_AUTH.SALT_ROUNDS);
                    params.push(hashedPassword);
                    set.push(`${f} = $${params.length}`);
                }
                else {
                    params.push(req.body[f]);
                    set.push(`${f} = $${params.length}`);
                }
            }
        }

        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json(
            {
                error: {
                    code: C_HTTP.CODE.BAD_REQUEST,
                    message: C_HTTP.MESSAGE.BAD_REQUEST } });
        params.push(id);
        const sql = `
            UPDATE users SET ${set.join(', ')}, updated_at = now()
            WHERE user_id = $${params.length}
            RETURNING ${C_USER.SAFE_RETURN}
        `;

        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// DELETE Users:id
//----------------------------------------------------------------------------------
router.delete(
    '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE User - ');
        const { id } = req.params;
        const { rowCount } = await query('DELETE FROM users WHERE user_id = $1', [id]);
        if (rowCount === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)

module.exports = router;