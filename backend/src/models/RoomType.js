const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoomType = sequelize.define('RoomType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Tên loại phòng là bắt buộc' }
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
}, {
  timestamps: true,
  tableName: 'room_types',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

module.exports = RoomType; 