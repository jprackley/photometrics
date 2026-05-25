const assert = require("node:assert");


require("../../utils/constants/cHTTP");

function assertEqualReturn(res, expected ) {

    assert.equal(
        res.statusCode, expected,
        `[EXPECTED] Status Code: ${expected}\n[ACTUAL] Status Code: ${res.statusCode} \n 
            ${JSON.stringify(res.body, null, 2)}`
    )
    if (res.statusCode === expected) { return res.body }
}

function assertEqual(res, expected ) {

    assert.equal(
        res.statusCode, expected,
        `[EXPECTED] Status Code: ${expected}\n[ACTUAL] Status Code: ${res.statusCode} \n 
            ${JSON.stringify(res.body, null, 2)}`
    )
}

function assertEqualQuery(resQuery, expectedQuery) {
    assert.equal(
        resQuery, expectedQuery,
        `[EXPECTED] Query: ${expectedQuery}\n[ACTUAL] Query result: ${resQuery} \n 
            ${JSON.stringify(resQuery, null, 2)}`
    )
}

module.exports = {
    assertEqualReturn,
    assertEqualQuery,
    assertEqual,
};