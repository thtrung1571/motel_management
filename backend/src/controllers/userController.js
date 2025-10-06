const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

const userController = {
  getAllUsers: catchAsync(async (req, res) => {
    const users = await User.findAll({
      where: { active: true },
      attributes: ['id', 'username', 'name', 'role']
    });
    
    res.status(200).json({
      status: 'success',
      data: users
    });
  }),

  createUser: catchAsync(async (req, res) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ 
      where: { 
        username,
        active: true 
      } 
    });

    if (existingUser) {
      throw new AppError('Tên đăng nhập đã tồn tại', 400);
    }

    try {
      // Tạo user mới
      const newUser = await User.create({
        username,
        password,
        name,
        role: role || 'user'
      });

      // Không trả về password trong response
      const userResponse = await User.findByPk(newUser.id, {
        attributes: ['id', 'username', 'name', 'role']
      });

      res.status(201).json({
        status: 'success',
        data: userResponse
      });
    } catch (error) {
      throw new AppError(error.message || 'Có lỗi xảy ra khi tạo người dùng', 500);
    }
  }),

  updateUser: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    // Kiểm tra user tồn tại không
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Kiểm tra username mới có trùng với user khác không
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username,
          id: { [Op.ne]: id },
          active: true
        } 
      });
      
      if (existingUser) {
        throw new AppError('Tên đăng nhập đã tồn tại', 400);
      }
    }

    // Cập nhật user
    await user.update({
      username: username || user.username,
      password: password || user.password, // Password sẽ được hash trong hooks nếu thay đổi
      name: name || user.name,
      role: role || user.role
    });

    // Lấy thông tin user đã cập nhật (không bao gồm password)
    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'username', 'name', 'role']
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser
    });
  }),

  deleteUser: catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Soft delete
    await user.update({ active: false });

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa người dùng thành công'
    });
  })
};

module.exports = userController;

