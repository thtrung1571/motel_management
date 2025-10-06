const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const formatLicensePlate = require('../utils/formatLicensePlate');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('carNumber', value.toUpperCase());
    }
  },
  isCarPlate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fullName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  gender: {
    type: DataTypes.ENUM('Nam', 'Nữ', 'Khác'),
    defaultValue: 'Khác'
  },
  cccd: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  birthDay: {
    type: DataTypes.DATE,
    allowNull: true
  },
  placeLiving: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  visitCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastVisit: {
    type: DataTypes.DATE,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isWalkIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'customers',
  indexes: [
    {
      fields: ['carNumber']
    }
  ]
});

// Tạo model cho mối quan hệ nhiều-nhiều giữa các customers
const CustomerRelation = sequelize.define('CustomerRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  relatedCustomerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'customer_relations',
  indexes: [
    {
      fields: ['customerId', 'relatedCustomerId'],
      unique: true
    }
  ]
});

// Sửa lại associations
Customer.belongsToMany(Customer, {
  through: CustomerRelation,
  as: 'relatedCustomers',
  foreignKey: 'customerId',
  otherKey: 'relatedCustomerId'
});

// Thêm associations mới
CustomerRelation.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});

CustomerRelation.belongsTo(Customer, {
  foreignKey: 'relatedCustomerId',
  as: 'relatedCustomer'
});

Customer.hasMany(CustomerRelation, {
  foreignKey: 'customerId',
  as: 'relations'
});

Customer.hasMany(CustomerRelation, {
  foreignKey: 'relatedCustomerId',
  as: 'relatedToRelations'
});

// Thêm association cho chiều ngược lại
Customer.belongsToMany(Customer, {
  through: CustomerRelation,
  as: 'relatedToCustomers',
  foreignKey: 'relatedCustomerId',
  otherKey: 'customerId'
});

// Instance method để format biển số
Customer.prototype.getFormattedCarNumber = function() {
  return formatLicensePlate(this.carNumber, this.isCarPlate);
};

module.exports = { Customer, CustomerRelation }; 