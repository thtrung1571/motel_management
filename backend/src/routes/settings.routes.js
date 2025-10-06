const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Public route (không cần xác thực)
router.get('/room-types-prices', settingsController.getRoomTypesWithPrices);

// Yêu cầu xác thực cho tất cả routes bên dưới
router.use(verifyToken);

// Routes cho quản lý loại phòng
router.get('/room-types', settingsController.getRoomTypes);
router.post('/room-types', restrictTo('admin'), settingsController.addRoomType);
router.put('/room-types/:id', restrictTo('admin'), settingsController.updateRoomType);
router.delete('/room-types/:id', restrictTo('admin'), settingsController.deleteRoomType);

// Routes cho quản lý cài đặt giá
router.get('/price-logic', restrictTo('admin'), settingsController.getPriceSettings);
router.put('/price-logic', restrictTo('admin'), settingsController.updatePriceSettings);

module.exports = router; 