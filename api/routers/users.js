const express = require('express');
const router = express.Router();
const C_SCHEMA = require('../../utils/constants/cSchema');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_NODE = require('../../utils/constants/cNodeServer');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {handleValidation, paginate, buildPagination} = require("../../utils/helpers/validation");
const hashPassword = require("../../utils/helpers/hashString");
const { query } = require('../db');
const { body, param} = require("express-validator");

//------------------------------//
//        CREATE User           //
//------------------------------//
router.post(
    '/',
    [
        body('first_name').isString().isLength({ min: C_SCHEMA.MIN.FIRST_NAME_LENGTH, max: C_SCHEMA.MAX.FIRST_NAME_LENGTH })
            .withMessage(`First name must be between ${C_SCHEMA.MIN.FIRST_NAME_LENGTH} and ${C_SCHEMA.MAX.FIRST_NAME_LENGTH} characters`),
        body('last_name').isString().isLength({ min: C_SCHEMA.MIN.LAST_NAME_LENGTH, max: C_SCHEMA.MAX.LAST_NAME_LENGTH })
            .withMessage(`Last name must be between ${C_SCHEMA.MIN.LAST_NAME_LENGTH} and ${C_SCHEMA.MAX.LAST_NAME_LENGTH} characters`),
        body('email').isEmail().isLength({ max: C_SCHEMA.MAX.EMAIL_LENGTH }).withMessage('Invalid email format'),
        body('password_hash').isString().withMessage('Password is invalid or missing'),
        body('account_role').isString().isIn(C_SCHEMA.USER_ROLES).withMessage('Invalid account role'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE User - ');
        const hashedPassword = hashPassword(req.body.password_hash);
        const { first_name, last_name, email, account_role } = req.body;

        const sql = `
            INSERT INTO users (first_name, last_name, email, password_hash, account_role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING 
                user_id,
                first_name,
                last_name,
                email,
                last_login,
                created_at,
                updated_at,
                account_role
        `;
        const { rows } = await query(sql, [first_name, last_name, email, hashedPassword, account_role ]);
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
            const sql = `SELECT ${C_SCHEMA.SAFE_USER_RETURN} FROM users`;
            const { rows } = await query(sql);
            return res.json(rows);
        }

        //Sets up the pagination variables
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });
        const sortable = Object.values(C_NODE.SORTABLE.USERS);
        const sortField = sortable.includes(String(sort)) ? sort : C_NODE.SORTABLE.USERS.CREATED;
        const sortDir = order === C_NODE.SORTABLE.ASCENDING ? C_NODE.SORTABLE.ASCENDING : C_NODE.SORTABLE.DESCENDING;
        const params = [];
        let where = '';

        //Basic whitelist for sort fields to avoid SQL injection
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} 
            OR email ILIKE $${params.length} OR account_role ILIKE $${params.length}`;
        }
        const sql = `
            SELECT ${C_SCHEMA.SAFE_USER_RETURN} FROM users
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
        const { rows } = await query(`SELECT ${C_SCHEMA.SAFE_USER_RETURN} FROM users WHERE user_id = $1`, [id]);
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
            RETURNING ${C_SCHEMA.SAFE_USER_RETURN}
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