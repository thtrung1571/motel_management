const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'completed'),
    defaultValue: 'active'
  },
  cashAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tổng tiền mặt trong ca'
  },
  bankingAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tổng tiền chuyển khoản trong ca'
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tổng doanh thu ca'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checkInShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID ca làm việc khi check-in'
  },
  checkOutShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID ca làm việc khi check-out'
  },
  isCrossShift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Đánh dấu giao dịch xuyên ca'
  }
}, {
  timestamps: true,
  tableName: 'shifts'
});

const ShiftTransaction = sequelize.define('ShiftTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shiftId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shifts',
      key: 'id'
    }
  },
  rentalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rentals',
      key: 'id'
    }
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('cash', 'banking'),
    allowNull: false
  },
  transactionTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  type: {
    type: DataTypes.ENUM('checkin', 'checkout', 'deposit', 'other'),
    defaultValue: 'checkout'
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'processing'),
    defaultValue: 'completed',
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Chi tiết giao dịch: số lượng khách, thời gian thuê, etc.'
  },
  checkInShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID ca làm việc khi check-in'
  },
  checkOutShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID ca làm việc khi check-out'
  },
  isCrossShift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Đánh dấu giao dịch xuyên ca'
  }
}, {
  timestamps: true,
  tableName: 'shift_transactions'
});

// Basic relationships that don't require other models
Shift.hasMany(ShiftTransaction, {
  foreignKey: 'shiftId',
  as: 'transactions'
});

ShiftTransaction.belongsTo(Shift, {
  foreignKey: 'shiftId',
  as: 'shift'
});

module.exports = { Shift, ShiftTransaction }; 