const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriceLogic = sequelize.define('PriceLogic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hourlyThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 1,
      max: 10
    }
  },
  baseHourPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 70000,
    validate: {
      min: { args: [0], msg: 'Giá giờ cơ bản phải lớn hơn hoặc bằng 0' },
      max: { args: [1000000000], msg: 'Giá giờ cơ bản không được vượt quá 1 tỷ' }
    }
  },
  additionalHourPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10000,
    validate: {
      min: { args: [0], msg: 'Giá giờ phụ trội phải lớn hơn hoặc bằng 0' },
      max: { args: [1000000000], msg: 'Giá giờ phụ trội không được vượt quá 1 tỷ' }
    }
  },
  halfDayStart: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '16:00',
    validate: {
      is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  halfDayEnd: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '08:00',
    validate: {
      is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  minHalfDayHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 11,
    validate: {
      min: 11,
      max: 14
    }
  },
  maxHalfDayHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 14,
    validate: {
      min: 11,
      max: 14,
      isValidRange(value) {
        if (value <= this.minHalfDayHours) {
          throw new Error('Số giờ tối đa phải lớn hơn số giờ tối thiểu');
        }
      }
    }
  },
  minFullDayHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
    validate: {
      min: 15,
      max: 24
    }
  },
  maxFullDayHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 24,
    validate: {
      min: 15,
      max: 24,
      isValidRange(value) {
        if (value <= this.minFullDayHours) {
          throw new Error('Số giờ tối đa phải lớn hơn số giờ tối thiểu');
        }
      }
    }
  },
  roomPrices: {
    type: DataTypes.JSON,
    defaultValue: {},
    validate: {
      isValidPriceStructure(value) {
        if (typeof value !== 'object') {
          throw new Error('Cấu trúc giá phòng không hợp lệ');
        }
        
        for (const [roomId, prices] of Object.entries(value)) {
          if (!prices.halfDayPrice || !prices.fullDayPrice ||
              prices.halfDayPrice < 0 || prices.fullDayPrice < 0 ||
              prices.halfDayPrice > 1000000000 || prices.fullDayPrice > 1000000000) {
            throw new Error(`Giá phòng không hợp lệ cho phòng ${roomId}`);
          }
        }
      }
    }
  }
}, {
  timestamps: true,
  tableName: 'price_logics',
  hooks: {
    beforeValidate: (priceLogic) => {
      if (!priceLogic.roomPrices) {
        priceLogic.roomPrices = {};
      }
    }
  }
});

module.exports = PriceLogic; 