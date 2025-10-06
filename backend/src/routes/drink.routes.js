const express = require('express');
const router = express.Router();
const drinkController = require('../controllers/drinkController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyToken);

// Public routes (sau khi xác thực)
router.get('/', drinkController.getAllDrinks);
router.get('/:id', drinkController.getDrinkById);

// Admin only routes
router.use(isAdmin);
router.post('/', drinkController.createDrink);
router.put('/:id', drinkController.updateDrink);
router.delete('/:id', drinkController.deleteDrink);
router.patch('/:id/stock', drinkController.updateStock);
router.get('/low-stock', drinkController.getLowStock);

module.exports = router; 