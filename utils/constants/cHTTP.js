//HTTP Status Codes and Descriptors
const STATUS = {
    //Successful Status Codes
    OK : 200,
    CREATED : 201,
    NO_CONTENT : 204,

    //Client Errors
    BAD_REQUEST : 400,
    UNAUTHORIZED : 401,
    FORBIDDEN : 403,
    NOT_FOUND : 404,
    CONFLICT : 409,
    UNPROCESSABLE_ENTITY : 422,

    //Server Errors
    INTERNAL_SERVER_ERROR : 500,
    NOT_IMPLEMENTED : 501,
    BAD_GATEWAY : 502,
    SERVICE_UNAVAILABLE : 503,
};

const CODE = {
    OK : 'OK',
    CREATED : 'Created',
    NO_CONTENT : 'No Content',
    BAD_REQUEST : 'Bad Request',
    UNAUTHORIZED : 'Unauthorized',
    FORBIDDEN : 'Forbidden',
    NOT_FOUND : 'Not Found',
    CONFLICT : 'Conflict',
    UNPROCESSABLE_ENTITY : 'Unprocessable Entity',
    INTERNAL_SERVER_ERROR : 'Internal Server Error',
    NOT_IMPLEMENTED : 'Not Implemented',
    BAD_GATEWAY : 'Bad Gateway',
    SERVICE_UNAVAILABLE : 'Service Unavailable',
};

const MESSAGE = {
    LOGIN: {
        UNAUTHORIZED: 'Invalid email or password',
    }
}
module.exports = {  STATUS, CODE, MESSAGE };