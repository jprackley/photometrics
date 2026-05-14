const express = require('express');
const {paginate, handleValidation, buildPagination} = require("../utils/validation");
const asyncHandler = require("../utils/asyncHandler");
const {query} = require("../db");
const router = express.Router();

//------------------------------//
//        CREATE Project         //
//------------------------------//


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
            where = `WHERE project_name ILIKE ${params.length} 
                OR status ILIKE ${params.length} 
                OR created_at ILIKE ${params.length}
                OR updated_at ILIKE ${params.length}
                OR completed_at ILIKE ${params.length}
                OR due_time ILIKE ${params.length}
                OR start_time ILIKE ${params.length}`;
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


//------------------------------//
//       Update Project         //
//------------------------------//



//------------------------------//
//       Delete Project         //
//------------------------------//

module.exports = router;

/////// TEstets