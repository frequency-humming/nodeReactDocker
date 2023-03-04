const express = require('express');
const eventData = require('../controllers/controller');

const router = express.Router();

router.get('/', eventData);

module.exports = router;