const express = require('express');
const router = express.Router();

// CREATE Project
router.get('/', (req, res) => {
    res.json({ ok: true });
});

module.exports = router;