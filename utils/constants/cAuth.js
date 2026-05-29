
const SALT_ROUNDS = 10;
const TOKEN_MAX_AGE_MS = 1000 * 120; // 1000ms * 120 = 2m
const REFRESH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

module.exports = {
    SALT_ROUNDS,
    TOKEN_MAX_AGE_MS,
    REFRESH_TOKEN_MAX_AGE_MS,
};