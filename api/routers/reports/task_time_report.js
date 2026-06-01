const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../api/handlers/asyncHandler');
const {param} = require("express-validator");
const {query} = require("../../db");

const C_HTTP = require("../../../utils/constants/cHTTP");



module.exports = router;