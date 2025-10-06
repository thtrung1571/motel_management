const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Production error response
  else {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error: don't leak error details
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra'
      });
    }
  }

  // Thêm xử lý cho các lỗi cụ thể
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Lỗi validation',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
};

module.exports = errorHandler; 