const { query } = require('express-validator');
C_NODE = require('../constants/cNodeServer');

const paginate = [
    query('page').optional().toInt().isInt({ min: C_NODE.PAGINATE.MIN_PAGE }).withMessage(`page must be >= ${C_NODE.PAGINATE.MIN_PAGE}`),
    query('limit').optional().toInt().isInt({ min: C_NODE.PAGINATE.MIN_LIMIT, max: C_NODE.PAGINATE.MAX_LIMIT })
        .withMessage(`limit ${C_NODE.PAGINATE.MIN_LIMIT}..${C_NODE.PAGINATE.MAX_LIMIT}`),
    query('sort').optional().isString(),
    query('order').optional().isIn([C_NODE.ASCENDING, C_NODE.DESCENDING]).withMessage('order asc|desc'),
];

function buildPagination({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    return { limit, offset };
}

//Handles validation for Node.js Express requests
function handleValidation(req, desc) {
    const C_HTTP = require('../constants/cHTTP');
    const { validationResult } = require('express-validator');

    const result = validationResult(req);
    if (!result.isEmpty()) {
        const details = result.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value,
            location: err.location
        }));

        console.table(details);

        const error = new Error(desc + 'Validation failed');
        error.status = C_HTTP.STATUS.BAD_REQUEST;
        error.code = C_HTTP.REASON.BAD_REQUEST;
        error.details = details;

        throw error;
    }
}

module.exports = { paginate, buildPagination, handleValidation };