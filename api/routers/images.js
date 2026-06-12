const express = require('express');
const {param, body } = require('express-validator');
const router = express.Router();

const {paginate, validationErrorHandler, buildPagination} = require('../handlers/expressHandlers');
const asyncHandler = require('../handlers/asyncHandler');
const {query} = require('../db');

const C_HTTP = require('../../utils/constants/cHTTP');
const C_IMAGE = require('../../utils/constants/cImages');
const C_NODE = require('../../utils/constants/cNodeServer');
const {verifyAuthentication} = require("../middleware/verifyAuthentication");

//----------------------------------------------------------------------------------
// Create Image
//----------------------------------------------------------------------------------
router.post(
    '/',
    verifyAuthentication,
    [
        body('project_id').isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional({ values: 'null' }).isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.NAME,
                max: C_IMAGE.MAX.NAME
            }).withMessage(`Image name must be between ${C_IMAGE.MIN.NAME} and ${C_IMAGE.MAX.NAME} characters.`),

        body('description').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.DESCRIPTION,
                max: C_IMAGE.MAX.DESCRIPTION
            }).withMessage(`Image description must be between ${C_IMAGE.MIN.DESCRIPTION} and ${C_IMAGE.MAX.DESCRIPTION} characters.`),

        body('url').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.URL,
                max: C_IMAGE.MAX.URL
            }).withMessage(`Image url must be between ${C_IMAGE.MIN.URL} and ${C_IMAGE.MAX.URL} characters long.`)
            .isURL().withMessage('Invalid image url format.'),
        body('status').optional({ values: 'null' }).isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('completed_at').optional({ values: 'null' }).isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'CREATE Image - ');

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

        res.status(C_HTTP.STATUS.CREATED).json({images: rows[0]});
    })
);

//----------------------------------------------------------------------------------
// BULK Create Images
//----------------------------------------------------------------------------------
router.post(
    '/bulk',
    //verifyAuthentication,
    [
        body('images').optional().isArray({ min: 1 }).withMessage('images must be a non-empty array'),
        body('images.*.project_id').optional().isUUID().withMessage('Invalid image project_id UUID'),
        body('images.*.projectId').optional().isUUID().withMessage('Invalid image projectId UUID'),
        body('images.*.task_id').optional({ values: 'null' }).isUUID().withMessage('Invalid image task_id UUID'),
        body('images.*.taskId').optional({ values: 'null' }).isUUID().withMessage('Invalid image taskId UUID'),
        body('images.*.name').optional({ values: 'null' }).isString().isLength({
            min: C_IMAGE.MIN.NAME,
            max: C_IMAGE.MAX.NAME
        }).withMessage(`Image name must be between ${C_IMAGE.MIN.NAME} and ${C_IMAGE.MAX.NAME} characters.`),
        body('images.*.description').optional({ values: 'null' }).isString().isLength({
            min: C_IMAGE.MIN.DESCRIPTION,
            max: C_IMAGE.MAX.DESCRIPTION
        }).withMessage(`Image description must be between ${C_IMAGE.MIN.DESCRIPTION} and ${C_IMAGE.MAX.DESCRIPTION} characters.`),
        body('images.*.url').optional({ values: 'null' }).isString().isLength({
            min: C_IMAGE.MIN.URL,
            max: C_IMAGE.MAX.URL
        }).withMessage(`Image url must be between ${C_IMAGE.MIN.URL} and ${C_IMAGE.MAX.URL} characters long.`).isURL().withMessage('Invalid image url format.'),
        body('images.*.status').optional({ values: 'null' }).isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('images.*.completed_at').optional({ values: 'null' }).isISO8601().withMessage('Invalid completed time format'),

        body('project_id').optional().isUUID().withMessage('Invalid project_id UUID'),
        body('projectId').optional().isUUID().withMessage('Invalid projectId UUID'),
        body('task_id').optional({ values: 'null' }).isUUID().withMessage('Invalid task_id UUID'),
        body('taskId').optional({ values: 'null' }).isUUID().withMessage('Invalid taskId UUID'),
        body('status').optional({ values: 'null' }).isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('count').optional().isInt({ min: 1, max: 1000 }).withMessage('count must be between 1 and 1000'),
        body('number').optional().isInt({ min: 1, max: 1000 }).withMessage('number must be between 1 and 1000'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'BULK CREATE Images - ');

        const requestImages = Array.isArray(req.body.images) ? req.body.images : null;
        const batchCount = Number(req.body.count || req.body.number || 0);
        const batchProjectId = req.body.project_id || req.body.projectId;
        const batchTaskId = req.body.task_id || req.body.taskId || null;
        const batchStatus = req.body.status || C_IMAGE.STATUS.PENDING;

        let images = requestImages;

        if (!images && batchProjectId && batchCount > 0) {
            images = Array.from({ length: batchCount }, (_, index) => ({
                project_id: batchProjectId,
                task_id: batchTaskId,
                name: req.body.name || `${batchStatus} Image ${index + 1}`,
                description: req.body.description || null,
                url: req.body.url || null,
                status: batchStatus,
                completed_at: req.body.completed_at || (batchStatus === C_IMAGE.STATUS.COMPLETED ? new Date().toISOString() : null),
            }));
        }

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
                error: {
                    code: C_HTTP.CODE.BAD_REQUEST,
                    message: 'Request body must include either images[] or project_id/projectId with count/number.',
                }
            });
        }

        const columns = [
            'project_id',
            'task_id',
            'name',
            'description',
            'url',
            'status',
            'completed_at'
        ];
        const params = [];
        const values = images.map((image, index) => {
            const projectId = image.project_id || image.projectId;
            const taskId = image.task_id || image.taskId || null;
            const status = image.status || C_IMAGE.STATUS.PENDING;

            const rowValues = [
                projectId,
                taskId,
                image.name || `Image ${index + 1}`,
                image.description || null,
                image.url || null,
                status,
                image.completed_at || image.completedAt || (status === C_IMAGE.STATUS.COMPLETED ? new Date().toISOString() : null),
            ];

            rowValues.forEach((value) => params.push(value));

            const offset = index * columns.length;
            return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`;
        });

        const sql = `
            INSERT INTO images (${columns.join(', ')})
            VALUES ${values.join(', ')}
            RETURNING *;
        `;

        const { rows } = await query(sql, params);

        res.status(C_HTTP.STATUS.CREATED).json({
            images: rows,
            count: rows.length,
        });
    })
);

//----------------------------------------------------------------------------------
// READ Image:id
//----------------------------------------------------------------------------------
router.get(
    '/:id',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Image - ');
        const {id} = req.params;
        const {rows} = await query('SELECT * FROM images WHERE image_id = $1', [id]);

        res.status(C_HTTP.STATUS.OK).json({images: rows[0]});
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
    verifyAuthentication,
    [paginate],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'READ Images - ');
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

            res.status(C_HTTP.STATUS.OK).json({images: rows});
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

        res.status(C_HTTP.STATUS.OK).json({images: rows, page: Number(page), limit: Number(limit), total: countRows[0].total});
    })
);
//----------------------------------------------------------------------------------
// PATCH Image:id
//----------------------------------------------------------------------------------
router.patch(
    '/:id',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
        body('project_id').optional({ values: 'null' }).isUUID().withMessage('Invalid project_id UUID'),
        body('task_id').optional({ values: 'null' }).isUUID().withMessage('Invalid task_id UUID'),
        body('name').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.NAME,
                max: C_IMAGE.MAX.NAME
            }).withMessage(`Image name must be between ${C_IMAGE.MIN.NAME} and ${C_IMAGE.MAX.NAME} characters long.`),

        body('description').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.DESCRIPTION,
                max: C_IMAGE.MAX.DESCRIPTION
            }).withMessage(`Image description must be between ${C_IMAGE.MIN.DESCRIPTION} and ${C_IMAGE.MAX.DESCRIPTION} characters long.`),

        body('url').optional({ values: 'null' }).isString().isLength(
            {
                min: C_IMAGE.MIN.URL,
                max: C_IMAGE.MAX.URL
            }).withMessage(`Image url must be between ${C_IMAGE.MIN.URL} and ${C_IMAGE.MAX.URL} characters long.`)
            .isURL().withMessage('Invalid image url format.'),
        body('status').optional({ values: 'null' }).isIn(Object.values(C_IMAGE.STATUS)).withMessage('Invalid image status'),
        body('completed_at').optional({ values: 'null' }).isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'UPDATE Image - ');
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

        if (set.length === 0) return res.status(C_HTTP.STATUS.BAD_REQUEST).json({
            error: {
                code: C_HTTP.CODE.BAD_REQUEST,
                message: C_HTTP.MESSAGE.BAD_REQUEST } });
        params.push(id);

        const sql = `
            UPDATE images SET ${set.join(', ')}, updated_at = now()
            WHERE image_id = $${params.length}
            RETURNING *
        `;
        const {rows} = await query(sql, params);

        res.status(C_HTTP.STATUS.OK).json({images: rows[0]});
    })
);
//----------------------------------------------------------------------------------
// DELETE Image:id
//----------------------------------------------------------------------------------
router.delete(
    '/:id',
    verifyAuthentication,
    [
        param('id').isUUID().withMessage('Invalid image_id UUID'),
    ],
    asyncHandler(async (req, res) => {
        validationErrorHandler(req, 'DELETE Image - ');
        const {id} = req.params;
        const {rows} = await query('DELETE FROM images WHERE image_id = $1 RETURNING *', [id]);

        res.status(C_HTTP.STATUS.NO_CONTENT).json({images: rows[0]});
    })
);

module.exports = router;
