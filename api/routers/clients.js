const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const C_NODE = require("../../utils/constants/cNodeServer");
const C_HTTP = require('../../utils/constants/cHTTP');
const C_CLIENT = require('../../utils/constants/cClients');

const asyncHandler = require('../../utils/helpers/asyncHandler');
const { query } = require('../db');
const {
    paginate,
    buildPagination,
    handleValidation
} = require('../../utils/helpers/validation');

//--------------------//
//   CREATE Client    //
//--------------------//
router.post(
    '/',
    [
        body('first_name').isString().isLength({
            min: C_CLIENT.MIN_LENGTH.FIRST_NAME,
            max: C_CLIENT.MAX_LENGTH.FIRST_NAME
        }).withMessage(`First name must be less than ${C_CLIENT.MAX_LENGTH.FIRST_NAME} characters long`),

        body('middle_name').optional().isLength({
            min: C_CLIENT.MIN_LENGTH.MIDDLE_NAME,
            max: C_CLIENT.MAX_LENGTH.MIDDLE_NAME
        }).withMessage(`Middle name must be less than ${C_CLIENT.MAX_LENGTH.MIDDLE_NAME} characters long`),

        body('last_name').isString().isLength({
            min: C_CLIENT.MIN_LENGTH.LAST_NAME,
            max: C_CLIENT.MAX_LENGTH.LAST_NAME
        }).withMessage(`Last name must be less than ${C_CLIENT.MAX_LENGTH.LAST_NAME} characters long`),

        body('title').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.TITLE,
            max: C_CLIENT.MAX_LENGTH.TITLE
        }).withMessage(`Title must be less than ${C_CLIENT.MAX_LENGTH.TITLE} characters long`),

        body('company_name').isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COMPANY_NAME,
            max: C_CLIENT.MAX_LENGTH.COMPANY_NAME
        }).withMessage(`Company name must be less than ${C_CLIENT.MAX_LENGTH.COMPANY_NAME} characters long`),

        body('email').isEmail().isLength({
            min: C_CLIENT.MIN_LENGTH.EMAIL,
            max: C_CLIENT.MAX_LENGTH.EMAIL
        }).withMessage(`Email must be an email and less than ${C_CLIENT.MAX_LENGTH.EMAIL} characters long`),

        body('phone_number').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.PHONE,
            max: C_CLIENT.MAX_LENGTH.PHONE
        }).withMessage(`Phone number must be less than ${C_CLIENT.MAX_LENGTH.PHONE} characters long`),

        body('website').optional().isURL().isLength({
            min: C_CLIENT.MIN_LENGTH.WEBSITE,
            max: C_CLIENT.MAX_LENGTH.WEBSITE
        }).withMessage(`Website must be a URL and less than ${C_CLIENT.MAX_LENGTH.WEBSITE} characters long`),

        body('notes').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.NOTES,
            max: C_CLIENT.MAX_LENGTH.NOTES
        }).withMessage(`Notes must be less than ${C_CLIENT.MAX_LENGTH.NOTES} characters long`),

        body('address_line1').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('address_line2').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 2 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('city').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.CITY,
            max: C_CLIENT.MAX_LENGTH.CITY
        }).withMessage(`City must be less than ${C_CLIENT.MAX_LENGTH.CITY} characters long`),

        body('state').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.STATE,
            max: C_CLIENT.MAX_LENGTH.STATE
        }).withMessage(`State must be less than ${C_CLIENT.MAX_LENGTH.STATE} characters long`),

        body('postal_code').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ZIP,
            max: C_CLIENT.MAX_LENGTH.ZIP
        }).withMessage(`Postal Code must be less than ${C_CLIENT.MAX_LENGTH.ZIP} characters long`),

        body('country').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COUNTRY,
            max: C_CLIENT.MAX_LENGTH.COUNTRY
        }).withMessage(`Country must be less than ${C_CLIENT.MAX_LENGTH.COUNTRY} characters long`),

        body('billing_address_line1').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('billing_address_line2').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 2 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('billing_city').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.CITY,
            max: C_CLIENT.MAX_LENGTH.CITY
        }).withMessage(`City must be less than ${C_CLIENT.MAX_LENGTH.CITY} characters long`),

        body('billing_state').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.STATE,
            max: C_CLIENT.MAX_LENGTH.STATE
        }).withMessage(`State must be less than ${C_CLIENT.MAX_LENGTH.STATE} characters long`),

        body('billing_postal_code').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ZIP,
            max: C_CLIENT.MAX_LENGTH.ZIP
        }).withMessage(`Postal Code must be less than ${C_CLIENT.MAX_LENGTH.ZIP} characters long`),

        body('billing_country').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COUNTRY,
            max: C_CLIENT.MAX_LENGTH.COUNTRY
        }).withMessage(`Country must be less than ${C_CLIENT.MAX_LENGTH.COUNTRY} characters long`),

    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Client - ');
        
        const columnKeys = Object.values(C_CLIENT.CREATED_COLUMNS);
        
        const columns = [];
        const values = [];
        const params = [];

        for (const column of columnKeys) {
            if (req.body[column] !== undefined) {
                columns.push(column);
                params.push(req.body[column]);
                values.push(`$${params.length}`);
            }
        }

        const sql = `
            INSERT INTO clients (${columns.join(', ')})
            VALUES (${values.join(', ')}) RETURNING *
        `;
        const {rows} = await query(sql, params);
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
        const { all = C_NODE.PAGINATE.ALL, page = C_NODE.PAGINATE.PAGE, limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT, order = C_NODE.PAGINATE.ORDER, q } = req.query;

        // If all is true, return all clients, Else return paginated results
        if (all === true) {
            const { rows } = await query('SELECT * FROM clients');
            return res.json(rows);
        }

        // Basic whitelist for sort fields to avoid SQL injection
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });
        const sortable = Object.values(C_CLIENT.CREATED_COLUMNS);
        for (const column of Object.values(C_CLIENT.UPDATED_COLUMNS)) {
            sortable.push(column)
        }

        //Will sort descending by last_name if no sort is provided
        const sortField = sortable.includes(String(sort)) ? sort : C_CLIENT.CREATED_COLUMNS.last_name;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

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
        body('first_name').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.FIRST_NAME,
            max: C_CLIENT.MAX_LENGTH.FIRST_NAME
        }).withMessage(`First name must be less than ${C_CLIENT.MAX_LENGTH.FIRST_NAME} characters long`),

        body('middle_name').optional().isLength({
            min: C_CLIENT.MIN_LENGTH.MIDDLE_NAME,
            max: C_CLIENT.MAX_LENGTH.MIDDLE_NAME
        }).withMessage(`Middle name must be less than ${C_CLIENT.MAX_LENGTH.MIDDLE_NAME} characters long`),

        body('last_name').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.LAST_NAME,
            max: C_CLIENT.MAX_LENGTH.LAST_NAME
        }).withMessage(`Last name must be less than ${C_CLIENT.MAX_LENGTH.LAST_NAME} characters long`),

        body('title').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.TITLE,
            max: C_CLIENT.MAX_LENGTH.TITLE
        }).withMessage(`Title must be less than ${C_CLIENT.MAX_LENGTH.TITLE} characters long`),

        body('company_name').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COMPANY_NAME,
            max: C_CLIENT.MAX_LENGTH.COMPANY_NAME
        }).withMessage(`Company name must be less than ${C_CLIENT.MAX_LENGTH.COMPANY_NAME} characters long`),

        body('email').optional().isEmail().isLength({
            min: C_CLIENT.MIN_LENGTH.EMAIL,
            max: C_CLIENT.MAX_LENGTH.EMAIL
        }).withMessage(`Email must be an email and less than ${C_CLIENT.MAX_LENGTH.EMAIL} characters long`),

        body('phone_number').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.PHONE,
            max: C_CLIENT.MAX_LENGTH.PHONE
        }).withMessage(`Phone number must be less than ${C_CLIENT.MAX_LENGTH.PHONE} characters long`),

        body('website').optional().isURL().isLength({
            min: C_CLIENT.MIN_LENGTH.WEBSITE,
            max: C_CLIENT.MAX_LENGTH.WEBSITE
        }).withMessage(`Website must be a URL and less than ${C_CLIENT.MAX_LENGTH.WEBSITE} characters long`),

        body('notes').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.NOTES,
            max: C_CLIENT.MAX_LENGTH.NOTES
        }).withMessage(`Notes must be less than ${C_CLIENT.MAX_LENGTH.NOTES} characters long`),

        body('address_line1').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('address_line2').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 2 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('city').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.CITY,
            max: C_CLIENT.MAX_LENGTH.CITY
        }).withMessage(`City must be less than ${C_CLIENT.MAX_LENGTH.CITY} characters long`),

        body('state').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.STATE,
            max: C_CLIENT.MAX_LENGTH.STATE
        }).withMessage(`State must be less than ${C_CLIENT.MAX_LENGTH.STATE} characters long`),

        body('postal_code').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ZIP,
            max: C_CLIENT.MAX_LENGTH.ZIP
        }).withMessage(`Postal Code must be less than ${C_CLIENT.MAX_LENGTH.ZIP} characters long`),

        body('country').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COUNTRY,
            max: C_CLIENT.MAX_LENGTH.COUNTRY
        }).withMessage(`Country must be less than ${C_CLIENT.MAX_LENGTH.COUNTRY} characters long`),

        body('billing_address_line1').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 1 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('billing_address_line2').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ADDRESS_LINE,
            max: C_CLIENT.MAX_LENGTH.ADDRESS_LINE
        }).withMessage(`Address line 2 must be less than ${C_CLIENT.MAX_LENGTH.ADDRESS_LINE} characters long`),

        body('billing_city').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.CITY,
            max: C_CLIENT.MAX_LENGTH.CITY
        }).withMessage(`City must be less than ${C_CLIENT.MAX_LENGTH.CITY} characters long`),

        body('billing_state').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.STATE,
            max: C_CLIENT.MAX_LENGTH.STATE
        }).withMessage(`State must be less than ${C_CLIENT.MAX_LENGTH.STATE} characters long`),

        body('billing_postal_code').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.ZIP,
            max: C_CLIENT.MAX_LENGTH.ZIP
        }).withMessage(`Postal Code must be less than ${C_CLIENT.MAX_LENGTH.ZIP} characters long`),

        body('billing_country').optional().isString().isLength({
            min: C_CLIENT.MIN_LENGTH.COUNTRY,
            max: C_CLIENT.MAX_LENGTH.COUNTRY
        }).withMessage(`Country must be less than ${C_CLIENT.MAX_LENGTH.COUNTRY} characters long`),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Client:id - ');
        const { id } = req.params;
        const fields = Object.values(C_CLIENT.CREATED_COLUMNS);
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