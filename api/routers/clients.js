const express = require('express');
const C = require('../utils/constants');
const C_HTTP = require('../utils/httpStatus');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../db');
const { body, param } = require('express-validator');
const { paginate, buildPagination, handleValidation } = require('../utils/validation');

//--------------------//
//   CREATE Client    //
//--------------------//
router.post(
    '/',
    [
        body('first_name').isString().isLength({ min: C.MIN.FIRST_NAME_LENGTH, max: C.MAX.FIRST_NAME_LENGTH }),
        body('last_name').isString().isLength({ min: C.MIN.LAST_NAME_LENGTH, max: C.MAX.LAST_NAME_LENGTH }),
        body('company_name').isString().isLength({ min: C.MIN.LAST_NAME_LENGTH, max: C.MAX.COMPANY_NAME_LENGTH }),
        body('email').isEmail().isLength({ max: C.MAX.EMAIL_LENGTH }),
        //body('created_at').isISO8601(),
        //body('updated_at').isISO8601(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Client - ');
        const { first_name, last_name, company_name, email } = req.body;

        const sql = `
      INSERT INTO clients (first_name, last_name, company_name, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const { rows } = await query(sql, [first_name, last_name, company_name, email]);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
);
//------------------------------------//
//          READ Client list          //
//   optional search and pagination   //
//------------------------------------//
router.get(
    '/',
    [paginate],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Clients - ');
        const { page = 1, limit = 20, sort = 'created_at', order = 'desc', q } = req.query;
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });

        // Basic whitelist for sort fields to avoid SQL injection
        const sortable = new Set(['created_at', 'updated_at', 'first_name', 'last_name', 'company_name']);
        const sortField = sortable.has(String(sort)) ? sort : 'created_at';
        const sortDir = order === 'asc' ? 'asc' : 'desc';

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR company_name ILIKE $${params.length}`;
        }
        const sql = `
            SELECT * FROM clients
            ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const { rows } = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total FROM clients ${where}`;
        const { rows: countRows } = await query(countSql, q ? [params[0]] : []);

        res.json({ data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total });
    })
);
//------------------------------------//
//       READ Client by UUID          //
//------------------------------------//
router.get(
    '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Client:id - ');
        const { id } = req.params;
        const { rows } = await query('SELECT * FROM clients WHERE client_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'Client ID not found' } });
        res.json(rows[0]);
    })
);

//------------------------------------//
//       UPDATE Client by UUID        //
//------------------------------------//
router.patch(
    '/:id',
    [
        param('id').isUUID(),
        body('first_name').optional().isString().isLength({ min: 1, max: 100 }),
        body('last_name').optional().isString().isLength({ min: 1, max: 100 }),
        body('company_name').optional().isString().isLength({ min: 1, max: 255 }),
        body('email').optional().isEmail().isLength({ max: 255 }),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Client:id - ');
        const { id } = req.params;
        const fields = ['first_name', 'last_name', 'company_name', 'email'];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        });
        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({ error: { code: C_HTTP.REASON.BAD_REQUEST, message: 'No updatable fields provided' } });
        params.push(id);

        const sql = `
      UPDATE clients SET ${set.join(', ')}, updated_at = now()
      WHERE client_id = $${params.length}
      RETURNING *
    `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'Client not found' } });
        res.json(rows[0]);
    })
);

//------------------------------------//
//         DELETE Client              //
//     CASCADES TO PROJECTS           //
//------------------------------------//
router.delete(
    '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Client:id - ');
        const { id } = req.params;
        const { rowCount } = await query('DELETE FROM clients WHERE client_id = $1', [id]);
        if (rowCount === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'Client not found' } });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
);

module.exports = router;