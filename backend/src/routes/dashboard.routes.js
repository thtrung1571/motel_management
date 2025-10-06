const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getDashboardData);
router.get('/daily-revenue', dashboardController.getDailyRevenue);
router.get('/customer-stats', dashboardController.getCustomerStats);

module.exports = router;
