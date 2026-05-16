const crypto = require("node:crypto");
const C_HTTP = require("../constants/cHTTP");
/**
 * Hashes a plain text password using SHA256.
 *
 * @param {string} string Plain text password to hash.
 * @returns {string} SHA256 password hash.
 */
function hashPassword(string) {
    if (!string || typeof string !== "string" || null) {
        const error = new Error("Password must be a non empty string");
        error.status = C_HTTP.STATUS.BAD_REQUEST;
        error.code = C_HTTP.REASON.BAD_REQUEST;
        throw error;
    }

    return crypto
        .createHash("sha256")
        .update(string)
        .digest("hex");
}

module.exports = hashPassword;