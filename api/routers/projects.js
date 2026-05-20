const express = require('express');
const {param, body} = require("express-validator");
const router = express.Router();

const {
    paginate,
    handleValidation,
    buildPagination,
    projectQueryParams
} = require("../../utils/helpers/validation");
const asyncHandler = require("../../utils/helpers/asyncHandler");
const {query} = require("../db");

const C_HTTP = require("../../utils/constants/cHTTP");
const C_NODE = require("../../utils/constants/cNodeServer");
const C_PROJECT = require("../../utils/constants/cProjects");


//----------------------------------------------------------------------------------
// CREATE Projects
//----------------------------------------------------------------------------------
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
        body('client_id').isUUID().withMessage('Invalid client ID format'),
        body('managed_by').optional().isUUID().withMessage('Invalid user ID format'),

        body('project_name').isString().isLength({
            min: C_PROJECT.MIN.NAME,
            max: C_PROJECT.MAX.NAME
        }).withMessage(`Project name must be less than ${C_PROJECT.MAX.NAME} characters long`),

        body('description').isString().isLength({
            min: C_PROJECT.MIN.DESCRIPTION,
            max: C_PROJECT.MAX.DESCRIPTION
        }).withMessage(`Project description must be less than ${C_PROJECT.MAX.DESCRIPTION} characters long`),

        body('status').optional().isIn(Object.values(C_PROJECT.STATUS)).withMessage('Invalid project status'),
        body('priority').optional().isIn(Object.values(C_PROJECT.PRIORITY)).withMessage('Invalid project priority'),

        body('notes').optional().isString().isLength({
            min: C_PROJECT.MIN.NOTES,
            max: C_PROJECT.MAX.NOTES
        }).withMessage(`Notes must be less than ${C_PROJECT.MAX.NOTES} characters long`),

        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('shoot_time').optional().isISO8601().withMessage('Invalid shoot time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'CREATE Project - ');
        const fields = [
            ...Object.values(C_PROJECT.REQUIRED_COLUMNS),
            ...Object.values(C_PROJECT.MUTABLE_COLUMNS)
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
)
//----------------------------------------------------------------------------------
// READ Projects
//  - all: true will return all clients
//  - all: false will return paginated results
//  - page: page number
//  - limit: number of results per page
//  - sort: column to sort by
//  - order: ascending or descending
//  - q: search query
//----------------------------------------------------------------------------------
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
            const sql = `SELECT * FROM projects`;
            const { rows } = await query(sql);
            return res.json(rows);
        }

        // Basic whitelist for sort fields to avoid SQL injection
        const { offset } = buildPagination({ page: Number(page), limit: Number(limit) });

        const sortable = [
            ...Object.values(C_PROJECT.REQUIRED_COLUMNS),
            ...Object.values(C_PROJECT.MUTABLE_COLUMNS),
            C_PROJECT.IMMUTABLE_COLUMNS.CREATED_AT
        ];
        const sortField = sortable.includes(String(sort)) ? sort : C_PROJECT.REQUIRED_COLUMNS.DUE;
        const sortDir = order === C_NODE.ASCENDING ? C_NODE.ASCENDING : C_NODE.DESCENDING;

        const params = [];
        let where = '';
        if (q) {
            params.push(`%${q}%`);
            where = `WHERE project_name ILIKE $${params.length} 
                OR description ILIKE $${params.length}
                OR status::TEXT ILIKE $${params.length}
                OR priority::TEXT ILIKE $${params.length}
                OR notes ILIKE $${params.length}
            `;
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
//----------------------------------------------------------------------------------
// READ Project:id
//----------------------------------------------------------------------------------
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
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
);
//----------------------------------------------------------------------------------
// Patch Project:id
//----------------------------------------------------------------------------------
/**
 * @description Updates an existing project by project ID.
 *
 * This endpoint validates the project ID and any provided request body fields.
 * Only fields included in the request body are updated. If no valid updatable
 * fields are provided, the endpoint returns a 400 Bad Request response.
 *
 * @param {string} req.params.id
 * The UUID of the project to update.
 * @param {string} [req.body.project_name]
 * Optional project name. Must be a string within the configured project name length limits.
 * @param {string} [req.body.client_id]
 * Optional client UUID assigned to the project.
 * @param {string} [req.body.managed_by]
 * Optional user UUID for the manager assigned to the project.
 * @param {string} [req.body.description]
 * Optional project description. Must be a string within the configured project description length limits.
 * @param {string} [req.body.status]
 * Optional project status. Must match one of the allowed project status values.
 * @param {string} [req.body.start_time]
 * Optional project start time. Must be a valid ISO 8601 date string.
 * @param {string} [req.body.due_time]
 * Optional project due time. Must be a valid ISO 8601 date string.
 * @param {string} [req.body.completed_at]
 * Optional project completion time. Must be a valid ISO 8601 date string.
 *
 * @returns {Object} 200
 * Returns the updated project object.
 * @returns {Object} 400
 * Returns a validation error or a message stating that no updatable fields were provided.
 * @returns {Object} 404
 * Returns an error if no project exists with the provided project ID.
 *
 * @example
 * PATCH /api/projects/0f8fad5b-d9cb-469f-a165-70867728950e
 *
 * {
 *   "project_name": "Updated Wedding Shoot",
 *   "status": "In Progress",
 *   "due_time": "2026-08-14T18:00:00.000Z"
 * }
 */
router.patch(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid project ID format'),
        body('client_id').optional().isUUID().withMessage('Invalid client ID format'),
        body('managed_by').optional().isUUID().withMessage('Invalid user ID format'),

        body('project_name').optional().isString().isLength({
            min: C_PROJECT.MIN.NAME,
            max: C_PROJECT.MAX.NAME
        }).withMessage(`Project name must be less than ${C_PROJECT.MAX.NAME} characters long`),

        body('description').optional().isString().isLength({
            min: C_PROJECT.MIN.DESCRIPTION,
            max: C_PROJECT.MAX.DESCRIPTION
        }).withMessage(`Project description must be less than ${C_PROJECT.MAX.DESCRIPTION} characters long`),

        body('status').optional().isIn(Object.values(C_PROJECT.STATUS)).withMessage('Invalid project status'),
        body('priority').optional().isIn(Object.values(C_PROJECT.PRIORITY)).withMessage('Invalid project priority'),

        body('notes').optional().isString().isLength({
            min: C_PROJECT.MIN.NOTES,
            max: C_PROJECT.MAX.NOTES
        }).withMessage(`Notes must be less than ${C_PROJECT.MAX.NOTES} characters long`),

        body('start_time').optional().isISO8601().withMessage('Invalid start time format'),
        body('shoot_time').optional().isISO8601().withMessage('Invalid shoot time format'),
        body('due_time').optional().isISO8601().withMessage('Invalid due time format'),
        body('completed_at').optional().isISO8601().withMessage('Invalid completed time format'),
    ],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'UPDATE Project:id - ');
        const { id } = req.params;
        const fields = [
            ...Object.values(C_PROJECT.REQUIRED_COLUMNS),
            ...Object.values(C_PROJECT.MUTABLE_COLUMNS)
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
            UPDATE projects SET ${set.join(', ')}, updated_at = now()
            WHERE project_id = $${params.length}
            RETURNING *
        `;
        const { rows } = await query(sql, params);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.json(rows[0]);
    })
)
//----------------------------------------------------------------------------------
// DELETE Project:id
//----------------------------------------------------------------------------------
/**
 * @description Deletes an existing project by project ID.
 *
 * This endpoint validates the project ID, deletes the matching project from
 * the database, and returns the deleted project object. If no project exists
 * with the provided ID, the endpoint returns a 404 Not Found response.
 *
 * @param {string} req.params.id
 * The UUID of the project to delete.
 *
 * @returns {Object} 204
 * Returns the deleted project object.
 * @returns {Object} 400
 * Returns a validation error if the project ID is not a valid UUID.
 * @returns {Object} 404
 * Returns an error if no project exists with the provided project ID.
 *
 * @example
 * DELETE /api/projects/0f8fad5b-d9cb-469f-a165-70867728950e
 */
router.delete(
    '/:id',
    [param('id').isUUID().withMessage('ID is an invalid UUID')],
    asyncHandler(async (req, res) => {
        handleValidation(req, 'DELETE Project:id - ');
        const { id } = req.params;
        const { rows } = await query('DELETE FROM projects WHERE project_id = $1 RETURNING *', [id]);
        if (rows.length === 0) return res.status(C_HTTP.STATUS.NOT_FOUND).json({
            error: {
                code: C_HTTP.CODE.NOT_FOUND,
                message: C_HTTP.MESSAGE.NOT_FOUND } });
        res.status(C_HTTP.STATUS.NO_CONTENT).send();
    })
)

module.exports = router;