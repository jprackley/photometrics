const express = require('express');
const {paginate, handleValidation, buildPagination} = require('../../utils/helpers/validation');
const {param, body, query: queryValidator} = require('express-validator');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const {query} = require('../db');
const C_HTTP = require('../../utils/constants/cHTTP');
const C_SCHEMA = require('../../utils/constants/cSchema');
const C_NODE = require('../../utils/constants/cNodeServer');

const router = express.Router();

function safeSort(sort) {
    return C_NODE.SORTABLE.IMAGE.includes(sort) ? sort : 'created_at';
}

function safeOrder(order) {
    return String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
}

router.post(
    '/',
    [
        body('project_id').isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional({nullable: true}).isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional().isString().isLength({min: 1, max: 255}).withMessage('Invalid image name'),
        body('description').optional({nullable: true}).isString().withMessage('Invalid image description'),
        body('url').optional({nullable: true}).isString().withMessage('Invalid image url'),
        body('status').optional().isIn(C_SCHEMA.STATUS.IMAGE).withMessage('Invalid image status'),
        body('completed').optional().isBoolean().withMessage('Invalid completed value').toBoolean(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Image - ');

        const fields = ['project_id', 'task_id', 'name', 'description', 'url', 'status', 'completed'];
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
                    code: C_HTTP.REASON.NOT_FOUND,
                    message: 'Image not found',
                },
            });
        }

        res.json(rows[0]);
    })
);

router.get(
    '/',
    [
        paginate,
        queryValidator('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        queryValidator('task_id').optional().isUUID().withMessage('Invalid task_id UUID'),
        queryValidator('status').optional().isIn(C_SCHEMA.STATUS.IMAGE).withMessage('Invalid image status'),
        queryValidator('completed').optional().isBoolean().withMessage('Invalid completed value').toBoolean(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Images - ');

        const {
            page = C_NODE.PAGINATE.PAGE,
            limit = C_NODE.PAGINATE.LIMIT,
            sort = C_NODE.PAGINATE.SORT,
            order = C_NODE.PAGINATE.ORDER,
            q,
            project_id,
            task_id,
            status,
            completed,
        } = req.query;

        const {offset} = buildPagination({page: Number(page), limit: Number(limit)});
        const params = [];
        const where = [];
        
        if (project_id) {
            params.push(project_id);
            where.push(`project_id = $${params.length}`);
        }
        if (task_id) {
            params.push(task_id);
            where.push(`task_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            where.push(`status = $${params.length}`);
        }
        if (completed !== undefined) {
            params.push(completed);
            where.push(`completed = $${params.length}`);
        }

        if (q) {
            params.push(`%${q}%`);
            where.push(`(
                image_id::text ILIKE $${params.length}
                OR project_id::text ILIKE $${params.length}
                OR task_id::text ILIKE $${params.length}
                OR name ILIKE $${params.length}
                OR description ILIKE $${params.length}
                OR url ILIKE $${params.length}
                OR status::text ILIKE $${params.length}
            )`);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const sortBy = safeSort(sort);
        const sortOrder = safeOrder(order);

        const sql = `
            SELECT *
            FROM images
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;
        params.push(Number(limit), offset);
        const {rows} = await query(sql, params);
        res.json({data: rows, page: Number(page), limit: Number(limit)});
    })
);

router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
        body('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional({nullable: true}).isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional().isString().isLength({min: 1, max: 255}).withMessage('Invalid image name'),
        body('description').optional({nullable: true}).isString().withMessage('Invalid image description'),
        body('url').optional({nullable: true}).isString().withMessage('Invalid image url'),
        body('status').optional().isIn(C_SCHEMA.STATUS.IMAGE).withMessage('Invalid image status'),
        body('completed').optional().isBoolean().withMessage('Invalid completed value').toBoolean(),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Image - ');
        const {id} = req.params;
        const fields = ['project_id', 'task_id', 'name', 'description', 'url', 'status', 'completed'];
        const set = [];
        const params = [];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                params.push(req.body[field]);
                set.push(`${field} = $${params.length}`);
            }
        });
        if (set.length === 0) {
            return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
                error: {
                    code: C_HTTP.REASON.BAD_REQUEST,
                    message: 'No updatable fields provided',
                },
            });
        }

        set.push('updated_at = now()');
        params.push(id);

        const sql = `
            UPDATE images
            SET ${set.join(', ')}
            WHERE image_id = $${params.length}
            RETURNING *
        `;
        const {rows} = await query(sql, params);

        if (rows.length === 0) {
            return res.status(C_HTTP.STATUS.NOT_FOUND).json({
                error: {
                    code: C_HTTP.REASON.NOT_FOUND,
                    message: 'Image not found',
                },
            });
        }
        res.json(rows[0]);
    })
);

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
                    code: C_HTTP.REASON.NOT_FOUND,
                    message: 'Image not found',
                },
            });
        }
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
);

module.exports = router;
