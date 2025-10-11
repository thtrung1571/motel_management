const express = require('express');
const router = express.Router();
const publicLookupController = require('../controllers/publicLookupController');

router.get('/lookup', publicLookupController.search);
router.get('/lookup/:id', publicLookupController.details);

module.exports = router;
