const express = require('express');
const {paginate, handleValidation, buildPagination} = require("../utils/validation");
const asyncHandler = require("../utils/asyncHandler");
const {query} = require("../db");
const {param, body} = require("express-validator");
const C_HTTP = require("../utils/httpStatus");
const C = require("../utils/constants");
const router = express.Router();

//------------------------------//
//        CREATE Project         //
//------------------------------//
/**
 * Creates a new project record.
 *
 * Successful response:
 * Status 201 Created
 * Returns the newly created project record.
 *
 * Error response:
 * Status 400 Bad Request
 * Returned when request body validation fails.
 *
 * @name CreateProject
 * @route {POST} /
 * @param {string} req.body.client_id UUID of the client associated with the project.
 * @param {string} [req.body.managed_by] Optional UUID of the manager assigned to the project.
 * @param {string} req.body.project_name Name of the project.
 * @param {string} req.body.description Description of the project.
 * @param {string} [req.body.status] Optional project status.
 * @param {string} [req.body.start_time] Optional project start time in ISO 8601 format.
 * @param {string} [req.body.due_time] Optional project due time in ISO 8601 format.
 * @param {string} [req.body.completed_at] Optional project completion time in ISO 8601 format.
 * @returns {Object} 201 Newly created project record.
 */
router.post(
    '/',
    [
        body('client_id').isUUID(),
        body('managed_by').optional().isUUID(),
        body('project_name').isString().isLength({ min: C.MIN.PROJECT_NAME_LENGTH, max: C.MAX.PROJECT_NAME_LENGTH }),
        body('description').isString().isLength({ min: C.MIN.PROJECT_DESC_LENGTH, max: C.MAX.PROJECT_DESC_LENGTH }),
        body('status').optional().isIn(C.STATUS.PROJECT).withMessage('Invalid project status'),
        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Project - ');
        const { client_id, managed_by, project_name, description, status, start_time, due_time, completed_at } = req.body;
        const sql = `
            INSERT INTO projects (client_id, managed_by, project_name, description, status, start_time, due_time, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const { rows } = await query(sql, [client_id, managed_by, project_name, description, status, start_time, due_time, completed_at]);
        res.status(C_HTTP.STATUS.CREATED).json(rows[0]);
    })
)

//------------------------------//
//         READ Project         //
//------------------------------//
/**
 * Retrieves a paginated list of projects from the database.
 *
 * Supports optional query parameters for pagination, sorting, ordering,
 * and searching project records.
 *
 * Query parameters:
 * @param {number} [page=1] The page number to retrieve.
 * @param {number} [limit=20] The maximum number of projects to return.
 * @param {string} [sort='due_time'] The project column used for sorting.
 * @param {string} [order='desc'] The sort direction. Use "asc" for ascending order.
 * @param {string} [q] Optional search value used to filter project records.
 *
 * Response:
 * @returns {Object} JSON response containing project data and pagination metadata.
 * @returns {Array<Object>} response.data List of project records.
 * @returns {number} response.page Current page number.
 * @returns {number} response.limit Number of records requested per page.
 * @returns {number} response.total Total number of matching project records.
 */
router.get(
    '/',
    [paginate],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Projects - ');
        const { page = 1, limit = 20, sort = 'due_time', order = 'desc', q } = req.query;
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });

        // Basic whitelist for sort fields to avoid SQL injection
        const sortable = new Set(
            [
                'project_name', 'status',
                'created_at', 'updated_at',
                'completed_at', 'due_time',
                'start_time'
            ]);
        const sortField = sortable.has(String(sort)) ? sort : 'created_at';
        const sortDir = order === 'asc' ? 'asc' : 'desc';

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE project_name ILIKE $${params.length} 
                OR status ILIKE $${params.length}`;
        }
        const sql = `
            SELECT * FROM projects
            ${where}
            ORDER BY ${sortField} ${sortDir}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        params.push(limit, offset);

        const { rows } = await query(sql, params);

        // total count for pagination UI
        const countSql = `SELECT count(*)::int AS total FROM projects ${where}`;
        const { rows: countRows } = await query(countSql, q ? [params[0]] : []);

        res.json({ data: rows, page: Number(page), limit: Number(limit), total: countRows[0].total });
    })
);
/**
 * Retrieves a single project by its project_id.
 *
 * The project id is passed as a route parameter and must be a valid UUID.
 * If the project exists, the route returns the matching project object.
 * If no project is found, the route returns a 404 Not Found response.
 *
 * Route parameters:
 * @param {string} id The UUID of the project to retrieve.
 *
 * Response:
 * @returns {Object} JSON response containing the project record.
 * @returns {string} response.project_id The unique project identifier.
 * @returns {string} response.project_name The name of the project.
 * @returns {string} response.status The current project status.
 * @returns {string} response.created_at The timestamp when the project was created.
 * @returns {string} response.updated_at The timestamp when the project was last updated.
 * @returns {string|null} response.completed_at The timestamp when the project was completed, if applicable.
 * @returns {string|null} response.due_time The project due date or time, if applicable.
 * @returns {string|null} response.start_time The project start date or time, if applicable.
 *
 * Error responses:
 * @returns {Object} 404 response if no project exists for the provided project_id.
 */
router.get(
    '/:id',
    [param('id').isUUID()],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'READ Project:id - ');
        const { id } = req.params;
        const { rows } = await query('SELECT * FROM projects WHERE project_id = $1', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'Project ID not found' } });
        res.json(rows[0]);
    })
);


//------------------------------//
//       Update Project         //
//------------------------------//
// noinspection JSCheckFunctionSignatures
router.patch(
    '/:id',
    [
        param('id').isUUID(),
        body('project_name').optional().isString().isLength({ min: C.MIN.PROJECT_NAME_LENGTH, max: C.MAX.PROJECT_NAME_LENGTH }),
        body('client_id').optional().isUUID(),
        body('managed_by').optional().isUUID(),
        body('description').optional().isString().isLength({ min: C.MIN.PROJECT_DESC_LENGTH, max: C.MAX.PROJECT_DESC_LENGTH }),
        body('status').optional().isIn(C.STATUS.PROJECT).withMessage('Invalid project status'),
        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Project:id - ');
        const { id } = req.params;
        const fields = ['project_name', 'client_id', 'managed_by', 'description', 'status', 'start_time', 'due_time', 'completed_at'];
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
            UPDATE projects SET ${set.join(', ')}
            WHERE project_id = $${params.length}
            RETURNING *
        `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({ error: { code: C_HTTP.REASON.NOT_FOUND, message: 'Project not found' } });
        res.json(rows[0]);
    })
)


//------------------------------//
//       Delete Project         //
//------------------------------//

module.exports = router;