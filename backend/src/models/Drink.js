const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Drink = sequelize.define('Drink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Tên đồ uống không được để trống' }
    }
  },
  costPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Giá nhập phải lớn hơn hoặc bằng 0' },
      max: { args: [1000000000], msg: 'Giá nhập không được vượt quá 1 tỷ' }
    }
  },
  sellingPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Giá bán phải lớn hơn hoặc bằng 0' },
      max: { args: [1000000000], msg: 'Giá bán không được vượt quá 1 tỷ' }
    }
  },
  unitsPerPack: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 24,
    validate: {
      min: { args: [1], msg: 'Số đơn vị/thùng phải lớn hơn 0' }
    }
  },
  packStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số thùng tồn kho không được âm' }
    }
  },
  unitStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số đơn vị lẻ không được âm' }
    }
  },
  alertThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: { args: [0], msg: 'Ngưỡng cảnh báo không được âm' }
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'drinks',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: {
        active: true
      }
    }
  ]
});

// Virtual field để tính tổng số đơn vị
Drink.prototype.getTotalUnits = function() {
  return (this.packStock * this.unitsPerPack) + this.unitStock;
};

module.exports = Drink;
