const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { CustomerRelation } = require('./Customer');
const { Shift, ShiftTransaction } = require('./Shift');
const Room = require('./Room');
const RoomType = require('./RoomType');
const User = require('./User');

const Rental = sequelize.define('Rental', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID của người dùng tạo rental'
  },
  carNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numberOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  checkInTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  checkInDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  checkOutTime: {
    type: DataTypes.STRING
  },
  checkOutDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  rentType: {
    type: DataTypes.ENUM('hourly', 'halfday', 'overnight'),
    defaultValue: 'hourly'
  },
  hasWarning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Đánh dấu đã có cảnh báo về ngưỡng thời gian'
  },
  warningDetails: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Chi tiết cảnh báo: suggestedType, suggestedPrice, etc',
    validate: {
      isValidWarning(value) {
        if (value && typeof value !== 'object') {
          throw new Error('Cấu trúc cảnh báo không hợp lệ');
        }
      }
    }
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT
  },
  charges: {
    type: DataTypes.JSON,
    defaultValue: {
      room: {
        type: null,
        amount: 0,
        details: {
          firstHour: { price: 0 },
          basePrice: 0,
          additionalHours: null,
          extraHours: null
        },
        warning: false,
        warningMessage: null
      },
      drinks: 0,
      discount: 0,
      additionalCharge: 0,
      total: 0,
      final: 0
    }
  },
  duration: {
    type: DataTypes.JSON,
    defaultValue: {
      hours: 0,
      minutes: 0,
      type: null
    }
  },
  payment: {
    type: DataTypes.JSON,
    defaultValue: {
      amount: 0,
      change: 0,
      method: 'cash',
      status: 'pending'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'banking'),
    defaultValue: 'cash',
    allowNull: false,
    comment: 'Phương thức thanh toán: tiền mặt hoặc chuyển khoản'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Trạng thái thanh toán'
  }
}, {
  timestamps: true,
  tableName: 'rentals',
  hooks: {
    afterCreate: async (rental, options) => {
      try {
        console.log(`Rental afterCreate hook - rental.id: ${rental.id}, rental.userId: ${rental.userId}`);
        
        // Kiểm tra nếu không có userId thì không tạo giao dịch check-in
        if (!rental.userId) {
          console.warn('Không có userId trong rental, bỏ qua việc tạo giao dịch check-in');
          return;
        }
        
        // Tìm ca làm việc hiện tại khi CHECK-IN
        const activeShift = await Shift.findOne({
          where: { 
            status: 'active',
            userId: rental.userId
          }
        });

        // Nếu không tìm thấy ca làm việc, ghi log và bỏ qua
        if (!activeShift) {
          console.warn(`Không tìm thấy ca làm việc đang hoạt động cho userId: ${rental.userId}`);
          return;
        }

        const room = await Room.findOne({
          where: { id: rental.roomId },
          include: [{
            model: RoomType,
            as: 'type',
            attributes: ['name', 'description']
          }]
        });

        if (!room) {
          console.warn(`Không tìm thấy thông tin phòng với id: ${rental.roomId}`);
          return;
        }

        // Tạo transaction cho CHECK-IN
        await ShiftTransaction.create({
          shiftId: activeShift.id,
          rentalId: rental.id,
          roomNumber: room.number,
          amount: 0,
          method: rental.payment_method || 'cash', // Đảm bảo có giá trị mặc định
          type: 'checkin',
          status: 'processing',
          checkInShiftId: activeShift.id,
          details: {
            numberOfGuests: rental.numberOfGuests,
            checkInTime: rental.checkInTime,
            roomType: room.type?.name || 'Unknown',
            roomTypeDescription: room.type?.description || '',
            floor: room.floor || 1,
            hasLoveChair: room.hasLoveChair || false,
            checkinBy: activeShift.userId // Lưu người check-in
          }
        }, {
          transaction: options.transaction
        });

      } catch (error) {
        console.error('Error creating checkin transaction:', error);
        throw error;
      }
    },

    afterUpdate: async (rental, options) => {
      if (rental.changed('payment_status') && rental.payment_status === 'completed') {
        try {
          // Kiểm tra nếu không có userId thì không tạo giao dịch check-out
          if (!rental.userId) {
            console.warn('Không có userId trong rental, bỏ qua việc tạo giao dịch check-out');
            return;
          }
          
          // Tìm ca làm việc hiện tại khi CHECKOUT - tìm bất kỳ ca nào đang hoạt động
          const activeShift = await Shift.findOne({
            where: { 
              status: 'active'
            },
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'username']
            }]
          });

          // Nếu không tìm thấy ca làm việc, ghi log và bỏ qua
          if (!activeShift) {
            console.warn(`Không tìm thấy ca làm việc đang hoạt động cho userId: ${rental.userId}`);
            return;
          }

          console.log(`Found active shift: ${activeShift.id} (user: ${activeShift.user.name})`);

          const room = await Room.findOne({
            where: { id: rental.roomId },
            include: [{
              model: RoomType,
              as: 'type',
              attributes: ['name', 'description']
            }]
          });

          if (!room) {
            console.warn(`Không tìm thấy thông tin phòng với id: ${rental.roomId}`);
            return;
          }

          // Tìm giao dịch check-in để xác định ca check-in
          const checkInTransaction = await ShiftTransaction.findOne({
            where: {
              rentalId: rental.id,
              type: 'checkin'
            }
          });

          // Xác định xem đây có phải là giao dịch xuyên ca hay không
          const isCrossShift = checkInTransaction && 
                              checkInTransaction.shiftId !== activeShift.id;

          console.log(`Processing checkout - isCrossShift: ${isCrossShift}, checkInShiftId: ${checkInTransaction?.shiftId}, activeShiftId: ${activeShift.id}`);
          console.log(`Payment details - amount: ${rental.payment?.amount}, totalAmount: ${rental.totalAmount}, change: ${rental.payment?.change}`);

          if (checkInTransaction) {
            // Nếu là giao dịch xuyên ca, tạo giao dịch check-out mới
            if (isCrossShift) {
              console.log(`Creating new checkout transaction for cross-shift rental`);
              
              // Tạo giao dịch check-out mới
              const checkoutTransaction = await ShiftTransaction.create({
                shiftId: activeShift.id,
                rentalId: rental.id,
                roomNumber: room.number,
                amount: rental.payment?.amount || rental.totalAmount || 0,
                method: rental.payment_method || 'cash',
                type: 'checkout',
                status: 'completed',
                checkInShiftId: checkInTransaction.shiftId,
                checkOutShiftId: activeShift.id,
                isCrossShift: true,
                transactionTime: new Date(),
                details: {
                  numberOfGuests: rental.numberOfGuests || 1,
                  checkInTime: rental.checkInTime || new Date().toISOString(),
                  checkOutTime: rental.checkOutTime || new Date().toISOString(),
                  roomType: room.type?.name || 'Unknown',
                  roomTypeDescription: room.type?.description || '',
                  floor: room.floor || 1,
                  hasLoveChair: room.hasLoveChair || false,
                  checkoutBy: activeShift.user.id,
                  isCrossShift: true,
                  checkInShiftId: checkInTransaction.shiftId,
                  customerPayment: rental.payment?.amount || 0,
                  change: rental.payment?.change || 0
                }
              }, {
                transaction: options.transaction
              });
              
              console.log(`Created checkout transaction: ${checkoutTransaction.id} for rental ${rental.id} in shift ${activeShift.id}`);
              
              // Cập nhật trạng thái của giao dịch check-in thành completed
              await checkInTransaction.update({
                status: 'completed'
              }, {
                transaction: options.transaction
              });
              
              console.log(`Updated check-in transaction ${checkInTransaction.id} status to completed`);
            } else {
              // Nếu không phải giao dịch xuyên ca, cập nhật giao dịch check-in thành giao dịch check-out
              console.log(`Updating check-in transaction to checkout for same-shift rental`);
              
              await checkInTransaction.update({
                type: 'checkout',
                status: 'completed',
                amount: rental.payment?.amount || rental.totalAmount || 0,
                method: rental.payment_method || 'cash',
                checkOutShiftId: activeShift.id,
                details: {
                  numberOfGuests: rental.numberOfGuests || 1,
                  checkInTime: rental.checkInTime || new Date().toISOString(),
                  checkOutTime: rental.checkOutTime || new Date().toISOString(),
                  roomType: room.type?.name || 'Unknown',
                  roomTypeDescription: room.type?.description || '',
                  floor: room.floor || 1,
                  hasLoveChair: room.hasLoveChair || false,
                  checkoutBy: activeShift.user.id,
                  isCrossShift: false,
                  checkInShiftId: checkInTransaction.shiftId,
                  customerPayment: rental.payment?.amount || 0,
                  change: rental.payment?.change || 0
                }
              }, {
                transaction: options.transaction
              });
              
              console.log(`Updated check-in transaction ${checkInTransaction.id} to checkout for rental ${rental.id}`);
            }
          } else {
            console.warn(`No check-in transaction found for rental ${rental.id}`);
          }

        } catch (error) {
          console.error('Error processing checkout:', error);
          throw error;
        }
      }
    }
  }
});

// Tạo model cho drinks trong rental
const RentalDrink = sequelize.define('RentalDrink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rentalId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  drinkId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  timestamps: true,
  tableName: 'rental_drinks'
});

// Tạo model cho additional cars
const RentalAdditionalCar = sequelize.define('RentalAdditionalCar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rentalId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  carNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('carNumber', value.toUpperCase());
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isWalkIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  numberOfGuests: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'left'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'rental_additional_cars',
  hooks: {
    afterCreate: async (additionalCar, options) => {
      if (!additionalCar.isWalkIn && additionalCar.customerId) {
        try {
          // Tự động tạo mối quan hệ với khách hàng chính
          const rental = await Rental.findByPk(additionalCar.rentalId);
          if (rental && rental.customerId) {
            await CustomerRelation.findOrCreate({
              where: {
                [Op.or]: [
                  { customerId: rental.customerId, relatedCustomerId: additionalCar.customerId },
                  { customerId: additionalCar.customerId, relatedCustomerId: rental.customerId }
                ]
              },
              defaults: {
                customerId: rental.customerId,
                relatedCustomerId: additionalCar.customerId,
                frequency: 1
              },
              transaction: options.transaction
            });
          }
        } catch (error) {
          console.error('Error creating customer relation:', error);
        }
      }
    }
  }
});

module.exports = { Rental, RentalDrink, RentalAdditionalCar };
