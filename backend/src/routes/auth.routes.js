const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public routes (không cần xác thực)
router.post('/login', authController.login);
router.get('/create-first-admin', authController.createFirstAdmin);
router.post('/refresh', authController.refresh);

// Protected routes
router.use(verifyToken);
router.get('/me', authController.getCurrentUser);

// Admin only routes
router.use(isAdmin);
router.post('/register', authController.createUser);

module.exports = router;