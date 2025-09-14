const express = require('express');
const {eventData, addEvent, eventsHandler} = require('../controllers/controller');

const router = express.Router();

router.get('/', eventData);
router.get('/streaming', eventsHandler);
router.post('/streaming', addEvent);

module.exports = router;