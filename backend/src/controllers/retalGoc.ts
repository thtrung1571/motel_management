const Rental = require('../models/Rental');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const PriceLogic = require('../models/PriceLogic');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const rentalController = {
  // Tạo lượt thuê phòng mới
  create: catchAsync(async (req, res) => {
    try {
      const { roomId, carNumber, numberOfGuests, checkInTime, rentType, drinks, isWalkIn } = req.body;

      // Kiểm tra room có tồn tại và available
      const room = await Room.findById(roomId);
      if (!room) {
        throw new AppError('Phòng không tồn tại', 404);
      }
      if (room.status !== 'available') {
        throw new AppError('Phòng không khả dụng', 400);
      }

      // Tạo hoặc lấy thông tin khách hàng chính
      let customer;
      if (isWalkIn) {
        // Tạo khách bộ hành mới
        customer = await Customer.create({
          carNumber: carNumber, // Đã được tạo từ frontend
          isWalkIn: true,
          visitCount: 1,
          lastVisit: new Date()
        });
      } else {
        // Tìm hoặc tạo khách hàng có xe
        customer = await Customer.findOne({ carNumber: carNumber.toUpperCase() });
        if (!customer) {
          customer = await Customer.create({
            carNumber: carNumber.toUpperCase(),
            visitCount: 1,
            lastVisit: new Date()
          });
        } else {
          customer.visitCount += 1;
          customer.lastVisit = new Date();
          await customer.save();
        }
      }

      // Tạo rental với thông tin khách hàng
      const rental = await Rental.create({
        roomId,
        customerId: customer._id,
        carNumber: customer.carNumber,
        numberOfGuests,
        checkInTime,
        rentType: rentType || 'hourly',
        drinks: drinks.map(drink => ({
          drink: drink.drink,
          name: drink.name,
          quantity: drink.quantity,
          price: drink.price
        })),
        status: 'active'
      });

      // Cập nhật trạng thái phòng
      room.status = 'occupied';
      await room.save();

      // Transform và trả về response
      const transformedRental = {
        _id: rental._id,
        roomInfo: {
          number: room.number,
          floor: room.floor,
          hasLoveChair: room.hasLoveChair,
          type: room.type
        },
        customerInfo: {
          fullName: customer.fullName || '',
          cccd: customer.cccd || '',
          phoneNumber: customer.phoneNumber || '',
          visitCount: customer.visitCount
        },
        carNumber: rental.carNumber,
        numberOfGuests: rental.numberOfGuests,
        checkInTime: rental.checkInTime,
        status: rental.status,
        drinks: rental.drinks.map(d => ({
          _id: d._id,
          name: d.name,
          quantity: d.quantity,
          price: d.price,
          drinkId: d.drink
        }))
      };

      res.status(201).json({
        status: 'success',
        data: transformedRental
      });
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }),

  // Check-out
  checkout: catchAsync(async (req, res, next) => {
    try {
      const { rentalId } = req.params;
      const { additionalCharges = 0, note = '', charges } = req.body;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return next(new AppError('Không tìm thấy thông tin thuê phòng', 404));
      }

      // Tính lại tổng tiền: room + drinks + additionalCharges mới
      const newTotal = charges.room.amount + charges.drinks + parseInt(additionalCharges);

      // Cập nhật rental với charges từ request
      rental.status = 'completed';
      rental.checkOutTime = new Date().toISOString();
      rental.checkOutDate = new Date();
      rental.charges = {
        room: charges.room,
        drinks: charges.drinks,
        additional: parseInt(additionalCharges),
        total: newTotal // Sử dụng tổng mới đã tính
      };
      rental.note = note;

      await rental.save();

      await Room.findByIdAndUpdate(rental.roomId, {
        status: 'cleaning'
      });

      res.status(200).json({
        status: 'success',
        data: { rental }
      });
    } catch (error) {
      next(error);
    }
  }),

  // Thêm đồ uống
  addDrinks: catchAsync(async (req, res) => {
    const { rentalId } = req.params;
    const { drinkId, quantity } = req.body;

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    const drinkIndex = rental.drinks.findIndex(d => 
      d.drinkId.toString() === drinkId
    );

    if (drinkIndex > -1) {
      rental.drinks[drinkIndex].quantity = quantity;
    } else {
      rental.drinks.push({ drinkId, quantity });
    }

    await rental.save();
    res.json(rental);
  }),

  // Thêm xe phụ
  addCar: catchAsync(async (req, res) => {
    const { rentalId } = req.params;
    const { carNumber, numberOfNewGuests = 1, isWalkIn = false } = req.body;

    let rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    // Xử lý khách mới
    let newCustomer;
    if (isWalkIn) {
      // Tạo khách bộ hành mới
      newCustomer = await Customer.create({
        carNumber: `WALK-IN-${Date.now()}`,
        isWalkIn: true,
        visitCount: 1,
        lastVisit: new Date()
      });
    } else {
      // Tìm hoặc tạo khách hàng có xe
      newCustomer = await Customer.findOne({ carNumber: carNumber.toUpperCase() });
      if (!newCustomer) {
        newCustomer = await Customer.create({
          carNumber: carNumber.toUpperCase(),
          visitCount: 1,
          lastVisit: new Date()
        });
      } else {
        newCustomer.visitCount += 1;
        newCustomer.lastVisit = new Date();
        await newCustomer.save();
      }
    }

    // Thêm mối quan hệ giữa các khách hàng
    const mainCustomer = await Customer.findById(rental.customerId);
    if (!mainCustomer.relatedCustomers.includes(newCustomer._id)) {
      mainCustomer.relatedCustomers.push(newCustomer._id);
      await mainCustomer.save();
    }
    if (!newCustomer.relatedCustomers.includes(mainCustomer._id)) {
      newCustomer.relatedCustomers.push(mainCustomer._id);
      await newCustomer.save();
    }

    // Cập nhật rental với khách mới
    rental = await Rental.findByIdAndUpdate(
      rentalId,
      {
        $push: {
          additionalCars: {
            carNumber: newCustomer.carNumber,
            customerId: newCustomer._id,
            isWalkIn: isWalkIn,
            addedAt: new Date()
          }
        },
        $inc: { numberOfGuests: numberOfNewGuests }
      },
      { new: true }
    )
    .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
    .populate('additionalCars.customerId', 'fullName cccd phoneNumber lastVisit visitCount carNumber isWalkIn');

    // Transform và trả về response
    const transformedRental = {
      _id: rental._id,
      roomInfo: rental.roomId ? {
        number: rental.roomId.number,
        floor: rental.roomId.floor,
        hasLoveChair: rental.roomId.hasLoveChair,
        type: rental.roomId.type
      } : null,
      customerInfo: rental.customerId,
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      status: rental.status,
      additionalCars: rental.additionalCars?.map(car => ({
        _id: car._id,
        carNumber: car.carNumber,
        customerInfo: car.customerId,
        addedAt: car.addedAt
      })) || [],
      drinks: rental.drinks?.map(d => ({
        _id: d._id || null,
        name: d.name || '',
        quantity: d.quantity || 0,
        price: d.price || 0,
        drinkId: d.drink?._id || d.drinkId || null
      })) || []
    };

    res.status(200).json({
      status: 'success',
      data: transformedRental
    });
  }),

  // Lấy danh sách đang thuê
  getActive: catchAsync(async (req, res) => {
    const rentals = await Rental.find({ status: 'active' })
      .populate('customerInfo')
      .populate('roomId');
    res.json(rentals);
  }),

  // Lấy chi tiết 1 lượt thuê
  getById: catchAsync(async (req, res) => {
    const rental = await Rental.findById(req.params.id)
      .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
      .populate({
        path: 'roomId',
        select: 'number type status floor hasLoveChair',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .populate('drinks.drink', 'name sellingPrice')
      .populate('additionalCars.customerId', 'fullName cccd phoneNumber lastVisit visitCount carNumber');

    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    // Transform data với kiểm tra null/undefined
    const transformedRental = {
      _id: rental._id,
      roomInfo: rental.roomId ? {
        number: rental.roomId.number,
        floor: rental.roomId.floor,
        hasLoveChair: rental.roomId.hasLoveChair,
        type: rental.roomId.type
      } : null,
      customerInfo: rental.customerId,
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      status: rental.status,
      additionalCars: rental.additionalCars?.map(car => ({
        _id: car._id,
        carNumber: car.carNumber,
        customerId: car.customerId,
        addedAt: car.addedAt
      })) || [],
      drinks: rental.drinks?.map(d => ({
        _id: d._id || null,
        name: d.name || '',
        quantity: d.quantity || 0,
        price: d.price || 0,
        drinkId: d.drink?._id || d.drinkId || null
      })) || []
    };

    console.log('Transformed rental data:', transformedRental); // Debug log

    res.status(200).json({
      status: 'success',
      data: transformedRental
    });
  }),

  // Get active rental by room ID
  getActiveByRoom: catchAsync(async (req, res) => {
    const { roomId } = req.params;
    
    const rental = await Rental.findOne({
      roomId,
      status: 'active'
    })
    .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
    .populate('additionalCars.customerId', 'fullName cccd phoneNumber lastVisit visitCount')
    .populate({
      path: 'roomId',
      select: 'number type status floor hasLoveChair',
      populate: {
        path: 'type',
        select: 'name'
      }
    })
    .populate('drinks.drink', 'name sellingPrice');

    if (!rental) {
      return res.status(200).json({
        status: 'success',
        data: null
      });
    }

    // Transform data với kiểm tra null/undefined
    const transformedRental = {
      _id: rental._id,
      roomInfo: rental.roomId ? {
        number: rental.roomId.number,
        floor: rental.roomId.floor,
        hasLoveChair: rental.roomId.hasLoveChair,
        type: rental.roomId.type
      } : null,
      customerInfo: rental.customerId,
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      status: rental.status,
      additionalCars: rental.additionalCars?.map(car => ({
        carNumber: car.carNumber,
        customerInfo: car.customerId
      })) || [],
      drinks: rental.drinks?.map(d => ({
        _id: d._id || null,
        name: d.name || '',
        quantity: d.quantity || 0,
        price: d.price || 0,
        drinkId: d.drink?._id || d.drinkId || null
      })) || []
    };

    res.status(200).json({
      status: 'success',
      data: transformedRental
    });
  }),

  updateDrinkQuantity: catchAsync(async (req, res) => {
    const { rentalId, drinkId } = req.params;
    const { change } = req.body;

    let rental = await Rental.findById(rentalId)
      .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
      .populate({
        path: 'roomId',
        select: 'number type status floor hasLoveChair',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .populate('drinks.drink', 'name sellingPrice');

    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    // Sửa lại cách tìm drink
    const drinkIndex = rental.drinks.findIndex(d => 
      (d.drink && d.drink._id.toString() === drinkId) || 
      (d.drinkId && d.drinkId.toString() === drinkId) ||
      d._id.toString() === drinkId
    );

    console.log('Found drink at index:', drinkIndex, 'with drinkId:', drinkId); // Debug log

    if (drinkIndex === -1) {
      throw new AppError('Không tìm thấy đồ uống trong đơn hàng', 404);
    }

    // Cập nhật số lượng
    const newQuantity = rental.drinks[drinkIndex].quantity + change;
    
    if (newQuantity < 0) {
      throw new AppError('Số lượng không thể âm', 400);
    }

    if (newQuantity === 0) {
      // Xóa đồ uống khỏi danh sách
      rental.drinks.splice(drinkIndex, 1);
    } else {
      // Cập nhật số lượng mới
      rental.drinks[drinkIndex].quantity = newQuantity;
    }

    await rental.save();

    // Populate và transform data tương tự như trên
    rental = await Rental.findById(rentalId)
      .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
      .populate({
        path: 'roomId',
        select: 'number type status floor hasLoveChair',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .populate('drinks.drink', 'name sellingPrice')
      .populate('additionalCars.customerId', 'fullName cccd phoneNumber lastVisit visitCount');

    const transformedRental = {
      _id: rental._id,
      roomInfo: {
        number: rental.roomId.number,
        floor: rental.roomId.floor,
        hasLoveChair: rental.roomId.hasLoveChair,
        type: {
          name: rental.roomId.type.name
        }
      },
      customerInfo: rental.customerId,
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      status: rental.status,
      additionalCars: rental.additionalCars.map(car => ({
        carNumber: car.carNumber,
        customerInfo: car.customerId,
        addedAt: car.addedAt
      })),
      drinks: rental.drinks.map(d => ({
        _id: d._id,
        name: d.name,
        quantity: d.quantity,
        price: d.price,
        drinkId: d.drink?._id
      }))
    };

    res.status(200).json({
      status: 'success',
      data: transformedRental
    });
  }),

  addDrink: catchAsync(async (req, res) => {
    const { rentalId } = req.params;
    const { drinkId, quantity, price, name } = req.body;

    let rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    // Kiểm tra xem đồ uống đã tồn tại chưa
    const existingDrinkIndex = rental.drinks.findIndex(d => 
      (d.drink && d.drink.toString() === drinkId) || 
      (d.drinkId && d.drinkId.toString() === drinkId)
    );

    if (existingDrinkIndex !== -1) {
      // Nếu đã tồn tại, tăng số lượng
      rental.drinks[existingDrinkIndex].quantity += quantity;
    } else {
      // Nếu chưa tồn tại, thêm mới
      rental.drinks.push({
        drink: drinkId,
        name: name,
        quantity: quantity,
        price: price
      });
    }

    await rental.save();

    // Populate đầy đủ thông tin trước khi trả về
    rental = await Rental.findById(rentalId)
      .populate('customerId', 'fullName cccd phoneNumber lastVisit visitCount')
      .populate({
        path: 'roomId',
        select: 'number type status floor hasLoveChair',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .populate('drinks.drink', 'name sellingPrice')
      .populate('additionalCars.customerId', 'fullName cccd phoneNumber lastVisit visitCount');

    // Transform data với kiểm tra null/undefined
    const transformedRental = {
      _id: rental._id,
      roomInfo: rental.roomId ? {
        number: rental.roomId.number,
        floor: rental.roomId.floor,
        hasLoveChair: rental.roomId.hasLoveChair,
        type: rental.roomId.type
      } : null,
      customerInfo: rental.customerId,
      carNumber: rental.carNumber,
      numberOfGuests: rental.numberOfGuests,
      checkInTime: rental.checkInTime,
      status: rental.status,
      additionalCars: rental.additionalCars?.map(car => ({
        carNumber: car.carNumber,
        customerInfo: car.customerId,
        addedAt: car.addedAt
      })) || [],
      drinks: rental.drinks?.map(d => ({
        _id: d._id || null,
        name: d.name || '',
        quantity: d.quantity || 0,
        price: d.price || 0,
        drinkId: d.drink?._id || d.drinkId || null
      })) || []
    };

    res.status(200).json({
      status: 'success',
      data: transformedRental
    });
  }),

  calculateCheckout: catchAsync(async (req, res, next) => {
    try {
      const { rentalId } = req.params;
      const { additionalCharges = 0 } = req.body;

      // Tìm thông tin thuê phòng với populate đầy đủ
      const rental = await Rental.findById(rentalId)
        .populate({
          path: 'roomId',
          populate: { 
            path: 'type',
            select: 'name'
          }
        })
        .populate('drinks.drink')
        .populate('customerId', 'fullName cccd phoneNumber') // Thêm populate cho khách hàng chính
        .populate('additionalCars.customerId', 'fullName cccd phoneNumber'); // Thêm populate cho khách đi cùng

      if (!rental) {
        return next(new AppError('Không tìm thấy thông tin thuê phòng', 404));
      }

      // Lấy cấu hình giá
      const priceLogic = await PriceLogic.findOne();
      if (!priceLogic) {
        return next(new AppError('Không tìm thấy cấu hình giá', 404));
      }

      // Tính thời gian thuê
      const checkInTime = new Date(rental.checkInTime);
      const checkOutTime = new Date();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      // Lấy giá phòng theo loại
      const roomTypeId = rental.roomId.type._id.toString();
      const roomPrices = priceLogic.roomPrices.get(roomTypeId);

      if (!roomPrices) {
        return next(new AppError('Không tìm thấy giá cho loại phòng này', 404));
      }

      // Tính tiền phòng
      let roomCharge = 0;
      let chargeType = '';
      let chargeDetails = {};

      if (rental.rentType === 'hourly') {
        if (durationHours <= 1) {
          // Dưới 1 giờ tính giá giờ cơ bản
          roomCharge = priceLogic.baseHourPrice;
          chargeType = 'hourly_base';
          chargeDetails = {
            type: 'hourly_base',
            hours: 1,
            basePrice: priceLogic.baseHourPrice,
            total: priceLogic.baseHourPrice
          };
        } 
        else if (durationHours > 1 && durationHours < priceLogic.hourlyThreshold) {
          // Trên 1 giờ và dưới ngưỡng giờ: giờ đầu tính giá cơ bản, các giờ sau tính giá phụ trội
          const additionalHours = Math.ceil(durationHours - 1);
          const additionalCharge = additionalHours * priceLogic.additionalHourPrice;
          roomCharge = priceLogic.baseHourPrice + additionalCharge;
          
          chargeType = 'hourly_mixed';
          chargeDetails = {
            firstHour: {
              price: priceLogic.baseHourPrice
            },
            additionalHours: {
              hours: additionalHours,
              pricePerHour: priceLogic.additionalHourPrice,
              total: additionalCharge
            },
            total: roomCharge
          };
        }
        else {
          // Vượt ngưỡng giờ: chuyển sang tính qua đêm
          rental.rentType = 'overnight';
          
          // Sử dụng logic tính tiền overnight
          if (durationHours <= 24) {
            // Trong vòng 24h: tính giá ngày đầy đủ
            roomCharge = roomPrices.fullDayPrice;
            chargeType = 'overnight';
            chargeDetails = {
              type: 'overnight',
              basePrice: roomPrices.fullDayPrice,
              total: roomPrices.fullDayPrice,
              convertedFromHourly: true
            };
          } else {
            // Vượt quá 24h: tính giá ngày đầy đủ + giờ phụ trội
            const overtimeHours = Math.ceil(durationHours - 24);
            const overtimeCharge = overtimeHours * priceLogic.additionalHourPrice;
            
            roomCharge = roomPrices.fullDayPrice + overtimeCharge;
            chargeType = 'overnight_overtime';
            chargeDetails = {
              base: {
                type: 'overnight',
                price: roomPrices.fullDayPrice
              },
              overtime: {
                hours: overtimeHours,
                pricePerHour: priceLogic.additionalHourPrice,
                total: overtimeCharge
              },
              total: roomCharge,
              convertedFromHourly: true
            };
          }
        }
      } else if (rental.rentType === 'halfday') {
        // Parse thời gian kết thúc nửa ngày từ cấu hình
        const [endHour, endMinute] = priceLogic.halfDayEnd.split(':').map(Number);
        const halfDayEndTime = new Date(checkInTime);
        halfDayEndTime.setHours(endHour, endMinute, 0, 0);
        
        // Nếu thời gian kết thúc nửa ngày là ngày hôm sau
        if (endHour < checkInTime.getHours()) {
          halfDayEndTime.setDate(halfDayEndTime.getDate() + 1);
        }

        if (checkOutTime <= halfDayEndTime) {
          // Trong khung giờ nửa ngày
          roomCharge = roomPrices.halfDayPrice;
          chargeType = 'half_day';
          chargeDetails = {
            type: 'half_day',
            basePrice: roomPrices.halfDayPrice,
            endTime: priceLogic.halfDayEnd,
            total: roomPrices.halfDayPrice
          };
        } else {
          // Vượt quá thời gian nửa ngày
          const overtimeHours = Math.ceil(
            (checkOutTime - halfDayEndTime) / (1000 * 60 * 60)
          );
          const overtimeCharge = overtimeHours * priceLogic.additionalHourPrice;
          
          roomCharge = roomPrices.halfDayPrice + overtimeCharge;
          chargeType = 'half_day_overtime';
          chargeDetails = {
            base: {
              type: 'half_day',
              price: roomPrices.halfDayPrice
            },
            overtime: {
              hours: overtimeHours,
              pricePerHour: priceLogic.additionalHourPrice,
              total: overtimeCharge
            },
            total: roomCharge
          };
        }
      } else {
        // Tính theo qua đêm
        if (durationHours <= 24) {
          // Trong vòng 24h: tính giá ngày đầy đủ
          roomCharge = roomPrices.fullDayPrice;
          chargeType = 'overnight';
          chargeDetails = {
            type: 'overnight',
            basePrice: roomPrices.fullDayPrice,
            total: roomPrices.fullDayPrice
          };
        } else {
          // Vượt quá 24h: tính giá ngày đầy đủ + giờ phụ trội
          const overtimeHours = Math.ceil(durationHours - 24);
          const overtimeCharge = overtimeHours * priceLogic.additionalHourPrice;
          
          roomCharge = roomPrices.fullDayPrice + overtimeCharge;
          chargeType = 'overnight_overtime';
          chargeDetails = {
            base: {
              type: 'overnight',
              price: roomPrices.fullDayPrice
            },
            overtime: {
              hours: overtimeHours,
              pricePerHour: priceLogic.additionalHourPrice,
              total: overtimeCharge
            },
            total: roomCharge
          };
        }
      }

      // Tính tiền đồ uống
      const drinkCharges = rental.drinks.reduce((total, drink) => {
        return total + (drink.quantity * drink.price);
      }, 0);

      // Tính tổng tiền
      const totalAmount = roomCharge + drinkCharges + (parseInt(additionalCharges) || 0);

      // Trả về kết quả tính toán với thông tin khách hàng
      res.status(200).json({
        status: 'success',
        data: {
          rental: {
            ...rental.toObject(),
            customerInfo: rental.customerId, // Thêm thông tin khách hàng chính
            additionalCars: rental.additionalCars.map(car => ({
              carNumber: car.carNumber,
              customerInfo: car.customerId, // Thêm thông tin khách đi cùng
              addedAt: car.addedAt
            })),
            duration: {
              hours: Math.floor(durationHours),
              minutes: Math.round((durationHours % 1) * 60)
            },
            charges: {
              room: {
                type: chargeType,
                amount: roomCharge,
                details: chargeDetails
              },
              drinks: drinkCharges,
              additional: parseInt(additionalCharges) || 0,
              total: totalAmount
            },
            rentType: rental.rentType
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }),

  getRoomHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let query = {};

      // Cải thiện logic lọc theo số phòng
      if (req.query.roomNumber) {
        const room = await Room.findOne({ number: req.query.roomNumber });
        if (room) {
          query.roomId = room._id;
        } else {
          return res.status(200).json({
            status: 'success',
            data: {
              rentals: [],
              total: 0,
              page,
              pages: 0
            }
          });
        }
      }

      // Cải thiện logic lọc theo thời gian
      if (req.query.startDate || req.query.endDate) {
        query.checkInDate = {};
        if (req.query.startDate) {
          query.checkInDate.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          query.checkInDate.$lte = endDate;
        }
      }

      if (req.query.status && req.query.status !== 'all') {
        query.status = req.query.status;
      }

      const rentals = await Rental.find(query)
        .populate({
          path: 'roomId',
          select: 'number type',
          populate: {
            path: 'type',
            select: 'name'
          }
        })
        .populate({
          path: 'customerId',
          select: 'fullName phoneNumber carNumber'
        })
        .populate({
          path: 'additionalCars.customerId',
          select: 'fullName phoneNumber carNumber'
        })
        .sort({ checkInDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Rental.countDocuments(query);

      // Định dạng lại dữ liệu trả về với đầy đủ thông tin
      const enhancedRentals = rentals.map(rental => {
        // Tính toán duration chính xác hơn
        let duration = null;
        if (rental.checkOutTime) {
          const checkIn = new Date(rental.checkInTime);
          const checkOut = new Date(rental.checkOutTime);
          const diffMs = checkOut - checkIn;
          
          // Tính số giờ và số phút
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          duration = {
            hours,
            minutes,
            total: Math.round(diffMs / (1000 * 60)) // Tổng số phút
          };
        }

        return {
          _id: rental._id,
          room: {
            number: rental.roomId?.number,
            type: rental.roomId?.type?.name
          },
          customer: rental.customerId ? {
            name: rental.customerId.fullName,
            phoneNumber: rental.customerId.phoneNumber,
            carNumber: rental.customerId.carNumber
          } : null,
          carNumber: rental.carNumber,
          additionalCars: rental.additionalCars?.map(car => ({
            carNumber: car.carNumber,
            customer: car.customerId ? {
              name: car.customerId.fullName,
              phoneNumber: car.customerId.phoneNumber,
              carNumber: car.customerId.carNumber
            } : null,
            addedAt: car.addedAt
          })) || [],
          numberOfGuests: rental.numberOfGuests,
          checkInTime: rental.checkInTime,
          checkOutTime: rental.checkOutTime,
          duration, // Thay đổi format của duration
          totalAmount: rental.charges?.total || 0,
          status: rental.status,
          note: rental.note,
          rentType: rental.rentType
        };
      });

      res.status(200).json({
        status: 'success',
        data: {
          rentals: enhancedRentals,
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error in getRoomHistory:', error);
      res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra khi lấy lịch sử phòng',
        error: error.message
      });
    }
  }
};

module.exports = rentalController; 