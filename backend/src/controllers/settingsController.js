const { RoomType, Room, PriceLogic } = require('../models');
const { sequelize } = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const settingsController = {
  addRoomType: catchAsync(async (req, res) => {
    const { name, description = '' } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Tên loại phòng không được để trống', 400);
    }

    try {
      // Kiểm tra xem loại phòng đã tồn tại chưa
      const existingType = await RoomType.findOne({ 
        where: { 
          name: name.trim(),
          active: true 
        } 
      });

      if (existingType) {
        throw new AppError('Loại phòng này đã tồn tại', 400);
      }

      const newRoomType = await RoomType.create({ 
        name: name.trim(),
        description: description.trim(),
        active: true
      });

      res.status(201).json({
        status: 'success',
        data: newRoomType
      });
    } catch (error) {
      // Log lỗi để debug
      console.error('Error in addRoomType:', error);

      // Nếu là lỗi validation của Sequelize
      if (error.name === 'SequelizeValidationError') {
        throw new AppError(error.errors[0].message, 400);
      }

      // Nếu là lỗi unique constraint của Sequelize
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Loại phòng này đã tồn tại', 400);
      }

      // Nếu là AppError thì throw lại
      if (error instanceof AppError) {
        throw error;
      }

      // Các lỗi khác
      throw new AppError('Có lỗi xảy ra khi thêm loại phòng', 500);
    }
  }),

  updateRoomType: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description = '' } = req.body;

    const roomType = await RoomType.findByPk(id);
    if (!roomType) {
      throw new AppError('Không tìm thấy loại phòng', 404);
    }

    // Nếu đổi tên, kiểm tra tên mới đã tồn tại chưa
    if (name !== roomType.name) {
      const existingType = await RoomType.findOne({ 
        where: { 
          name,
          active: true,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingType) {
        throw new AppError('Tên loại phòng này đã tồn tại', 400);
      }
    }

    await roomType.update({ 
      name: name || roomType.name,
      description
    });

    res.status(200).json({
      status: 'success',
      data: roomType
    });
  }),

  deleteRoomType: catchAsync(async (req, res) => {
    const { id } = req.params;

    // Kiểm tra xem có phòng nào đang sử dụng loại phòng này không
    const roomsUsingType = await Room.findOne({ 
      where: { 
        roomTypeId: id,
        active: true 
      } 
    });

    if (roomsUsingType) {
      throw new AppError('Không thể xóa loại phòng đang được sử dụng', 400);
    }

    await RoomType.update(
      { active: false },
      { where: { id } }
    );

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa loại phòng thành công'
    });
  }),

  getRoomTypes: catchAsync(async (req, res) => {
    const roomTypes = await RoomType.findAll({
      where: { active: true }
    });

    res.status(200).json({
      status: 'success',
      data: roomTypes
    });
  }),

  getPriceSettings: catchAsync(async (req, res) => {
    let priceLogic = await PriceLogic.findOne();
    
    if (!priceLogic) {
      priceLogic = await PriceLogic.create({});
    }

    res.status(200).json({
      status: 'success',
      data: priceLogic
    });
  }),

  updatePriceSettings: catchAsync(async (req, res) => {
    const {
      hourlyThreshold,
      baseHourPrice,
      additionalHourPrice,
      halfDayStart,
      halfDayEnd,
      minHalfDayHours,
      maxHalfDayHours,
      minFullDayHours,
      maxFullDayHours,
      roomPrices
    } = req.body;

    // Validate thời gian
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(halfDayStart) || !timeRegex.test(halfDayEnd)) {
      throw new AppError('Định dạng thời gian không hợp lệ (HH:mm)', 400);
    }

    // Validate các giá trị số
    if (hourlyThreshold < 1 || hourlyThreshold > 10) {
      throw new AppError('Số giờ tối đa tính theo giờ phải từ 1-10', 400);
    }

    if (minHalfDayHours < 11 || minHalfDayHours > 14) {
      throw new AppError('Số giờ tối thiểu nửa ngày phải từ 11-14', 400);
    }

    if (maxHalfDayHours < minHalfDayHours || maxHalfDayHours > 14) {
      throw new AppError('Số giờ tối đa nửa ngày phải lớn hơn tối thiểu và không quá 14', 400);
    }

    if (minFullDayHours < 15 || minFullDayHours > 24) {
      throw new AppError('Số giờ tối thiểu nguyên ngày phải từ 15-24', 400);
    }

    if (maxFullDayHours < minFullDayHours || maxFullDayHours > 24) {
      throw new AppError('Số giờ tối đa nguyên ngày phải lớn hơn tối thiểu và không quá 24', 400);
    }

    // Parse và validate roomPrices
    let parsedRoomPrices;
    try {
      parsedRoomPrices = JSON.parse(roomPrices);
      
      // Validate cấu trúc và giá trị của roomPrices
      for (const [roomTypeId, prices] of Object.entries(parsedRoomPrices)) {
        if (!prices || typeof prices !== 'object') {
          throw new AppError(`Cấu trúc giá không hợp lệ cho phòng ${roomTypeId}`, 400);
        }

        const { halfDayPrice, fullDayPrice } = prices;
        if (typeof halfDayPrice !== 'number' || typeof fullDayPrice !== 'number' ||
            halfDayPrice < 0 || fullDayPrice < 0) {
          throw new AppError(`Giá không hợp lệ cho phòng ${roomTypeId}`, 400);
        }

        // Kiểm tra roomType có tồn tại
        const roomType = await RoomType.findByPk(roomTypeId);
        if (!roomType || !roomType.active) {
          throw new AppError(`Loại phòng ${roomTypeId} không tồn tại hoặc không còn hoạt động`, 400);
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Định dạng giá phòng không hợp lệ', 400);
    }

    // Cập nhật hoặc tạo mới cài đặt
    let priceLogic = await PriceLogic.findOne();
    
    const updateData = {
      hourlyThreshold,
      baseHourPrice,
      additionalHourPrice,
      halfDayStart,
      halfDayEnd,
      minHalfDayHours,
      maxHalfDayHours,
      minFullDayHours,
      maxFullDayHours,
      roomPrices: parsedRoomPrices
    };

    if (!priceLogic) {
      priceLogic = await PriceLogic.create(updateData);
    } else {
      await priceLogic.update(updateData);
    }

    res.status(200).json({
      status: 'success',
      data: priceLogic
    });
  }),

  getRoomTypesWithPrices: catchAsync(async (req, res) => {
    // Lấy tất cả loại phòng đang active
    const roomTypes = await RoomType.findAll({
      where: { active: true },
      include: [{
        model: Room,
        as: 'rooms',
        where: { active: true },
        required: false,
        attributes: []
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('rooms.id')), 'roomCount']
        ]
      },
      group: ['RoomType.id']
    });

    // Lấy cài đặt giá
    const priceLogic = await PriceLogic.findOne();
    
    // Parse roomPrices từ JSON string
    let parsedRoomPrices = {};
    try {
      parsedRoomPrices = priceLogic?.roomPrices ? 
        (typeof priceLogic.roomPrices === 'string' ? 
          JSON.parse(priceLogic.roomPrices) : 
          priceLogic.roomPrices
        ) : {};
    } catch (error) {
      console.error('Error parsing roomPrices:', error);
    }

    const roomTypesWithDetails = roomTypes.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      roomCount: parseInt(type.getDataValue('roomCount')),
      prices: {
        hourly: {
          base: parseFloat(priceLogic?.baseHourPrice) || 0,
          additional: parseFloat(priceLogic?.additionalHourPrice) || 0,
          threshold: priceLogic?.hourlyThreshold || 0
        },
        halfDay: {
          price: parseFloat(parsedRoomPrices[type.id]?.halfDayPrice) || 0,
          minHours: priceLogic?.minHalfDayHours || 11,
          maxHours: priceLogic?.maxHalfDayHours || 14,
          timeRange: {
            start: priceLogic?.halfDayStart || "00:00",
            end: priceLogic?.halfDayEnd || "00:00"
          }
        },
        fullDay: {
          price: parseFloat(parsedRoomPrices[type.id]?.fullDayPrice) || 0,
          minHours: priceLogic?.minFullDayHours || 15,
          maxHours: priceLogic?.maxFullDayHours || 24
        }
      },
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      data: roomTypesWithDetails
    });
  })
};

module.exports = settingsController;