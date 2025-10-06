const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');

const authMiddleware = {
  verifyToken: async (req, res, next) => {
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
  },

  isAdmin: async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        return next(new AppError('Không có quyền truy cập', 403));
      }
      next();
    } catch (error) {
      next(error);
    }
  },

  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
      }
      next();
    };
  }
};

module.exports = authMiddleware; 