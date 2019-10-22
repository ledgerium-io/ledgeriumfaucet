const express = require('express');

const router = express.Router();
router.use('/api', require('./routes/api'));

module.exports = router;
