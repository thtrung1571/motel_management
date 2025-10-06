const { Room, RoomType, Rental } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const roomController = {
  getAllRooms: catchAsync(async (req, res) => {
    const rooms = await Room.findAll({
      where: { active: true },
      include: [
        { 
          model: RoomType,
          as: 'type'
        },
        {
          model: Rental,
          as: 'currentRental',
          where: { status: 'active' },
          required: false,
          attributes: ['numberOfGuests', 'carNumber']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: rooms
    });
  }),

  addRoom: catchAsync(async (req, res) => {
    const { number, roomTypeId, floor, hasLoveChair } = req.body;

    // Kiểm tra số phòng tồn tại
    const existingRoom = await Room.findOne({
      where: { 
        number: number.trim(),
        active: true
      }
    });

    if (existingRoom) {
      throw new AppError('Số phòng này đã tồn tại', 400);
    }

    const room = await Room.create({
      number: number.trim(),
      roomTypeId,
      floor,
      hasLoveChair: hasLoveChair || false,
      status: 'available'
    });

    const roomWithType = await Room.findByPk(room.id, {
      include: ['type']
    });

    res.status(201).json({
      status: 'success',
      data: roomWithType
    });
  }),

  updateRoom: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { number, roomTypeId, floor, status, hasLoveChair } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      throw new AppError('Không tìm thấy phòng', 404);
    }

    // Kiểm tra số phòng mới
    if (number && number !== room.number) {
      const existingRoom = await Room.findOne({
        where: {
          number: number.trim(),
          id: { [Op.ne]: id },
          active: true
        }
      });

      if (existingRoom) {
        throw new AppError('Số phòng này đã tồn tại', 400);
      }
    }

    await room.update({
      number: number || room.number,
      roomTypeId: roomTypeId || room.roomTypeId,
      floor: floor || room.floor,
      status: status || room.status,
      hasLoveChair: hasLoveChair !== undefined ? hasLoveChair : room.hasLoveChair
    });

    const updatedRoom = await Room.findByPk(id, {
      include: ['type']
    });

    res.status(200).json({
      status: 'success',
      data: updatedRoom
    });
  }),

  deleteRoom: catchAsync(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
      throw new AppError('Không tìm thấy phòng', 404);
    }

    if (room.status === 'occupied') {
      throw new AppError('Không thể xóa phòng đang có khách', 400);
    }

    // Soft delete
    await room.update({ active: false });

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa phòng thành công'
    });
  }),

  updateStatus: catchAsync(async (req, res) => {
    const { roomId } = req.params;
    const { status } = req.body;

    const room = await Room.findByPk(roomId);
    if (!room) {
      throw new AppError('Không tìm thấy phòng', 404);
    }

    await room.update({ status });

    res.status(200).json({
      status: 'success',
      data: room
    });
  }),

  getRoomHistory: catchAsync(async (req, res) => {
    const { page = 1, limit = 10, roomNumber, startDate, endDate, status } = req.query;

    // Build where clause
    let where = {};
    
    if (roomNumber) {
      const room = await Room.findOne({ where: { number: roomNumber } });
      if (room) {
        where.roomId = room.id;
      } else {
        return res.status(200).json({
          status: 'success',
          data: {
            rentals: [],
            total: 0,
            page: parseInt(page),
            pages: 0
          }
        });
      }
    }

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) {
        where.checkInDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.checkInDate[Op.lte] = endDateTime;
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const { count, rows: rentals } = await Rental.findAndCountAll({
      where,
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['number']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phoneNumber']
        }
      ],
      order: [['checkInDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const enhancedRentals = rentals.map(rental => ({
      id: rental.id,
      room: {
        number: rental.room?.number
      },
      customer: {
        name: rental.customer?.name,
        phoneNumber: rental.customer?.phoneNumber
      },
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      checkOutTime: rental.checkOutTime,
      duration: rental.checkOutTime ? 
        Math.round((new Date(rental.checkOutTime) - new Date(rental.checkInTime)) / (1000 * 60)) : 
        null,
      totalAmount: rental.charges?.total || 0,
      status: rental.status,
      note: rental.note
    }));

    res.status(200).json({
      status: 'success',
      data: {
        rentals: enhancedRentals,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  })
};

module.exports = roomController; 