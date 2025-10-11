const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const roomRoutes = require('./room.routes');
const customerRoutes = require('./customer.routes');
const rentalRoutes = require('./rental.routes');
const drinkRoutes = require('./drink.routes');
const userRoutes = require('./user.routes');
const settingsRoutes = require('./settings.routes');
const dashboardRoutes = require('./dashboard.routes');
const shiftRoutes = require('./shift.routes');
const publicRoutes = require('./public.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/customers', customerRoutes);
router.use('/rentals', rentalRoutes);
router.use('/drinks', drinkRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/shifts', shiftRoutes);
router.use('/public', publicRoutes);

module.exports = router;
