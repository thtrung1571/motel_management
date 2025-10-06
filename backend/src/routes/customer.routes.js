const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyToken);

// Đặt route search trước để ưu tiên matching
router.get('/search', customerController.searchCustomers);
router.get('/search/:id', customerController.getCustomerDetails);

// Đặt route import 
router.post('/import', upload.single('file'), customerController.importCustomers);

// Routes cho khách hàng liên quan
router.get('/related', customerController.getRelatedCustomers);
router.post('/related', customerController.addRelatedCustomer);
router.delete('/related/:id', customerController.removeRelatedCustomer);

// Route lấy khách hàng theo biển số
router.get('/car/:carNumber', customerController.getByCarNumber);

// Các routes CRUD cơ bản
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router; 