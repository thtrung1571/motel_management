const { User } = require('../models');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

// Kiểm tra biến môi trường
const checkRequiredEnvVars = () => {
  const required = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_SECRET', 'JWT_REFRESH_EXPIRES_IN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

checkRequiredEnvVars();

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return next(new AppError('Vui lòng nhập tên đăng nhập và mật khẩu', 400));
    }

    // Tìm user active với Sequelize
    const user = await User.findOne({ 
      where: { 
        username,
        active: true 
      }
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Tên đăng nhập hoặc mật khẩu không đúng', 401));
    }

    const token = signToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    // Cập nhật refresh token
    await user.update({ refreshToken });

    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Không tìm thấy refresh token', 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findOne({ 
      where: {
        id: decoded.id,
        refreshToken,
        active: true
      }
    });

    if (!user) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
    }

    const newToken = signToken(user.id);

    res.status(200).json({
      status: 'success',
      token: newToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token không hợp lệ', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token đã hết hạn', 401));
    }
    next(error);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { 
        id: decoded.id,
        active: true
      }
    });
    
    if (!user) {
      return next(new AppError('Token không hợp lệ', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token không hợp lệ', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token đã hết hạn', 401));
    }
    next(error);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
    }
    next();
  };
};

exports.createFirstAdmin = async (req, res, next) => {
  try {
    const existingAdmin = await User.findOne({
      where: { 
        role: 'admin',
        active: true 
      }
    });

    if (existingAdmin) {
      return next(new AppError('Admin đã tồn tại trong hệ thống', 400));
    }

    const defaultAdmin = {
      username: 'admin',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin',
      active: true
    };

    const newAdmin = await User.create(defaultAdmin);
    const token = signToken(newAdmin.id);
    const refreshToken = createRefreshToken(newAdmin.id);

    await newAdmin.update({ refreshToken });

    res.status(201).json({
      status: 'success',
      message: 'Tài khoản admin mặc định đã được tạo',
      token,
      refreshToken,
      data: {
        user: {
          id: newAdmin.id,
          username: newAdmin.username,
          name: newAdmin.name,
          role: newAdmin.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(new AppError('User không tồn tại', 404));
    }

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({
      where: {
        username: req.body.username,
        active: true
      }
    });

    if (existingUser) {
      return next(new AppError('Tên đăng nhập đã tồn tại', 400));
    }

    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role || 'user',
      active: true
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;