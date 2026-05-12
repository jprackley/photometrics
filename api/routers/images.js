const express = require('express');
const router = express.Router();

// Optional: a ping endpoint so the mount is verifiable
router.get('/', (req, res) => {
    res.json({ ok: true });
});

module.exports = router;