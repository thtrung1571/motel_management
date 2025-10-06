const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { CustomerRelation } = require('../models');

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyToken);

// Routes cho khách hàng liên quan
router.get('/related-customers', rentalController.getRelatedCustomers);

// Thêm route mới cho tính giá ước tính
router.get('/estimate-price', rentalController.estimatePrice);

// Lấy danh sách rentals theo phòng
router.get('/room/:roomId/active', rentalController.getActiveByRoom);
router.get('/room/:roomId/history', rentalController.getRoomHistory);

// Lấy danh sách tất cả rentals
router.get('/active', rentalController.getActiveRentals);
router.get('/history', rentalController.getRentalHistory);

// Tạo rental mới
router.post('/', rentalController.create);

// Quản lý rental cụ thể
router.get('/:id', rentalController.getRentalDetails);
router.patch('/:id/settings', rentalController.updateSettings);
router.post('/calculate-checkout', rentalController.calculateCheckout);
router.post('/checkout', rentalController.checkout);

// Quản lý drinks trong rental
router.post('/:rentalId/drinks', rentalController.addDrinks);
router.patch('/:rentalId/drinks/:drinkId', rentalController.updateDrinkQuantity);
router.delete('/:rentalId/drinks/:drinkId', rentalController.deleteDrink);

// Quản lý xe phụ
router.post('/:rentalId/cars', rentalController.addAdditionalCar);
router.delete('/:rentalId/cars/:carId', rentalController.removeAdditionalCar);

// Admin only routes
router.use(isAdmin);
router.get('/statistics/daily', rentalController.getDailyStatistics);
router.get('/statistics/monthly', rentalController.getMonthlyStatistics);

module.exports = router;