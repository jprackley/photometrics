const { param, body, query } = require('express-validator');
const C = require('./constants');

//Custom validators
const isUUID = () => param('id').isUUID().withMessage('Invalid UUID');
const isProjectStatus =() => param('status').isIn(C.STATUS.PROJECT).withMessage('Invalid project status');

const paginate = [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page must be >= 1'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 1..100'),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']).withMessage('order asc|desc'),
];

function buildPagination({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    return { limit, offset };
}

//Handles validation for Node.js Express requests
function handleValidation(req, desc) {
    const C_HTTP = require('./httpStatus');
    const { validationResult } = require('express-validator');

    const result = validationResult(req);
    if (!result.isEmpty()) {
        const error = new Error(desc + 'Validation failed');
        error.status = C_HTTP.STATUS.BAD_REQUEST;
        error.details = result.array();
        throw error;
    }
}

module.exports = { isUUID, isProjectStatus, paginate, buildPagination, handleValidation };