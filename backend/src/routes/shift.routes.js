const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { verifyToken: protect, restrictTo } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

// Routes chỉ cho user và admin
router.use(restrictTo('user', 'admin'));

// Quản lý ca làm việc
router.post('/start', shiftController.startShift);
router.post('/end', shiftController.endShift);

// Lấy thông tin ca
router.get('/current', shiftController.getCurrentShift);
router.get('/current/report', shiftController.getCurrentShiftReport);
router.get('/:shiftId/summary', shiftController.getShiftSummary);

// Routes chỉ cho admin
router.use(restrictTo('admin'));
router.get('/all', shiftController.getAllShifts);

module.exports = router; 