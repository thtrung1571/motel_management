const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const rentalController = require('../controllers/rentalController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyToken);

// Thêm route mới cho thống kê tần suất phòng
router.get('/frequency', rentalController.getRoomFrequencyStats);

// Public routes (sau khi xác thực)
router.get('/', roomController.getAllRooms);
router.patch('/:roomId/status', roomController.updateStatus);

// Admin only routes
router.use(isAdmin);
router.post('/', roomController.addRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);
router.get('/history', roomController.getRoomHistory);

module.exports = router; 