const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Số phòng không được để trống' }
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'cleaning', 'maintenance'),
    defaultValue: 'available',
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Số tầng không được để trống' }
    }
  },
  hasLoveChair: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  roomTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Loại phòng không được để trống' }
    }
  }
}, {
  timestamps: true,
  tableName: 'rooms',
  hooks: {
    beforeValidate: (room) => {
      if (room.number) {
        room.number = room.number.trim();
      }
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['number'],
      name: 'rooms_number_idx'
    },
    {
      fields: ['status'],
      name: 'rooms_status_idx'
    },
    {
      fields: ['roomTypeId'],
      name: 'rooms_room_type_idx'
    }
  ]
});

// Định nghĩa associations trong file index.js của models
Room.associate = (models) => {
  Room.belongsTo(models.RoomType, {
    foreignKey: 'roomTypeId',
    as: 'type'
  });

  Room.hasMany(models.Rental, {
    foreignKey: 'roomId',
    as: 'rentals'
  });

  Room.hasOne(models.Rental, {
    foreignKey: 'roomId',
    as: 'currentRental',
    scope: {
      status: 'active'
    }
  });
};

module.exports = Room;