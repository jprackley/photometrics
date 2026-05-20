const express = require('express');
const {param, body, query: queryValidator} = require('express-validator');
const router = express.Router();

const {paginate, handleValidation, buildPagination} = require('../../utils/helpers/validation');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {query} = require('../db');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_IMAGE = require('../../utils/constants/cImages');
const C_NODE = require('../../utils/constants/cNodeServer');

//----------------------------------------------------------------------------------
// Create Image
//----------------------------------------------------------------------------------
router.post(
    '/',
    [
        body('project_id').isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional().isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.NAME,
                max: C_IMAGE.MAX.NAME
            }).withMessage(`Image name must be between ${C_IMAGE.MIN.NAME} and ${C_IMAGE.MAX.NAME} characters.`),

        body('description').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.DESCRIPTION,
                max: C_IMAGE.MAX.DESCRIPTION
            }).withMessage(`Image description must be between ${C_IMAGE.MIN.DESCRIPTION} and ${C_IMAGE.MAX.DESCRIPTION} characters.`),

        body('url').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.URL,
                max: C_IMAGE.MAX.URL
            }).withMessage(`Image url must be between ${C_IMAGE.MIN.URL} and ${C_IMAGE.MAX.URL} characters long.`)
            .isURL().withMessage('Invalid image url format.'),
        body('status').optional().isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('completed').optional().isBoolean().withMessage('Invalid completed value').toBoolean(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Image - ');

        const fields = [
            ...Object.values(C_IMAGE.REQUIRED_COLUMNS),
            ...Object.values(C_IMAGE.MUTABLE_COLUMNS)
        ];
        const columns = [];
        const values = [];
        const params = [];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                params.push(req.body[field]);
                columns.push(field);
                values.push(`$${params.length}`);
            }
        });

        const sql = `
            INSERT INTO images (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *
        `;

        const {rows} = await query(sql, params);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
);
//----------------------------------------------------------------------------------
// READ Image:id
//----------------------------------------------------------------------------------
router.get(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Image - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM images WHERE image_id = $1', [id]);

        if (rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({
                error: {
                    code: C_HTTP.CODE.NOT_FOUND,
                    message: C_HTTP.MESSAGE.NOT_FOUND,
                },
            });
        }

        res.json(rows[0]);
    })
);
//----------------------------------------------------------------------------------
// READ Image with pagination
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
        handleValidation(req, 'READ Images - ');
        const {
            all = C_NODE.PAGINATE.ALL,
            page = C_NODE.PAGINATE.PAGE,
            limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT,
            order = C_NODE.PAGINATE.ORDER,
            q
        } = req.query;

        if (all === 'true') {
            const {rows} = await query(`SELECT *
                                        FROM tasks`);
            return res.json(rows);
        }
        const {offset} = buildPagination({page: Number(page), limit: Number(C_NODE.PAGINATE.LIMIT)});

        const sortable = [
            ...Object.values(C_IMAGE.REQUIRED_COLUMNS),
            ...Object.values(C_IMAGE.MUTABLE_COLUMNS),
            C_IMAGE.IMMUTABLE_COLUMNS.CREATED
        ];
        const sortField = sortable.includes(String(sort)) ? sort : C_IMAGE.IMMUTABLE_COLUMNS.CREATED;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `
            WHERE name ILIKE $${params.length}
            OR description ILIKE $${params.length}
            OR url ILIKE $${params.length}
            OR status::TEXT ILIKE $${params.length}
            `;
        }
        const sql = `
            SELECT *
            FROM images ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} 
            OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const {rows} = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total
                          FROM images ${where}`;
        const {rows: countRows} = await query(countSql, q ? [params[0]] : []);

        res.json({data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total});
    })
);
//----------------------------------------------------------------------------------
// PATCH Image:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
        body('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional().isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.NAME,
                max: C_IMAGE.MAX.NAME
            }).withMessage(`Image name must be between ${C_IMAGE.MIN.NAME} and ${C_IMAGE.MAX.NAME} characters long.`),

        body('description').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.DESCRIPTION,
                max: C_IMAGE.MAX.DESCRIPTION
            }).withMessage(`Image description must be between ${C_IMAGE.MIN.DESCRIPTION} and ${C_IMAGE.MAX.DESCRIPTION} characters long.`),

        body('url').optional().isString().isLength(
            {
                min: C_IMAGE.MIN.URL,
                max: C_IMAGE.MAX.URL
            }).withMessage(`Image url must be between ${C_IMAGE.MIN.URL} and ${C_IMAGE.MAX.URL} characters long.`)
            .isURL().withMessage('Invalid image url format.'),
        body('status').optional().isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('completed').optional().isBoolean().withMessage('Invalid completed value').toBoolean(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Image - ');
        const { id } = req.params;
        const fields = [
            ...Object.values(C_IMAGE.REQUIRED_COLUMNS),
            ...Object.values(C_IMAGE.MUTABLE_COLUMNS),
        ];
        const set = [];
        const params = [];
        fields.forEach((f) => {
            if (req.body[f] != null) {
                params.push(req.body[f]);
                set.push(`${f} = $${params.length}`);
            }
        });

        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({ error: { code: C_HTTP.MESSAGE.BAD_REQUEST, message: 'No updatable fields provided' } });
        params.push(id);

        const sql = `
            UPDATE images SET ${set.join(', ')}, updated_at = now()
            WHERE image_id = $${params.length}
            RETURNING *
        `;
        const {rows} = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error:
                {
                    code: C_HTTP.MESSAGE.NOT_FOUND,
                    message: 'Project not found'
                }
        });
        res.json(rows[0]);
    })
);
//----------------------------------------------------------------------------------
// DELETE Image:id
//----------------------------------------------------------------------------------
router.delete(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Image - ');
        const {id} = req.params;
        const {rowCount} = await query('DELETE FROM images WHERE image_id = $1', [id]);

        if (rowCount === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({
                error: {
                    code: C_HTTP.CODE.NOT_FOUND,
                    message: C_HTTP.MESSAGE.NOT_FOUND,
                },
            });
        }
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
);

module.exports = router;
