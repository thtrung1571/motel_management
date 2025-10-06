const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router; 