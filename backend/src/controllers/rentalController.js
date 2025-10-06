const { Rental, RentalDrink, RentalAdditionalCar } = require('../models');
const { Room, Customer, Drink, PriceLogic, CustomerRelation, ShiftTransaction } = require('../models');
const PriceCalculationService = require('../services/priceCalculationService');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const calculateRentalCharges = async (rental, checkOutTime, additionalCharges = 0, discount = 0) => {
  const priceCalculator = await PriceCalculationService.initialize();
  
  // Tính tiền phòng
  const roomCharge = await priceCalculator.calculateCharge(
    rental.checkInTime,
    checkOutTime,
    rental.rentType,
    rental.room.type.id
  );

  // Tính tổng tiền đồ uống
  const drinksTotal = rental.drinks.reduce((sum, drink) => 
    sum + (drink.price * drink.quantity), 0
  );

  // Tính tổng bill trước khi giảm giá
  const subtotal = roomCharge.amount + drinksTotal;

  // Tính giảm giá (nếu có)
  const discountAmount = parseFloat(discount) || 0;

  // Tính thu khác (nếu có)
  const additionalAmount = parseFloat(additionalCharges) || 0;

  // Tính tổng cuối cùng
  const finalAmount = subtotal - discountAmount + additionalAmount;

  return {
    charges: {
      room: {
        ...roomCharge,
        checkInTime: rental.checkInTime,
        checkOutTime: checkOutTime.toISOString(),
        rentType: rental.rentType,
        // Thêm thông tin warning nếu có
        ...(roomCharge.warning && {
          warning: roomCharge.warning,
          suggestedType: roomCharge.suggestedType,
          suggestedPrice: roomCharge.suggestedPrice,
          warningMessage: roomCharge.warningMessage
        }),
        // Thêm thông tin auto change nếu có
        ...(roomCharge.autoChanged && {
          autoChanged: true,
          previousType: roomCharge.previousType,
          changedTo: roomCharge.changedTo
        })
      },
      drinks: {
        items: rental.drinks,
        total: drinksTotal
      },
      discount: discountAmount,
      additionalCharge: additionalAmount,
      subtotal: subtotal,
      final: finalAmount
    },
    duration: {
      hours: Math.floor((checkOutTime - new Date(rental.checkInTime)) / (1000 * 60 * 60)),
      minutes: Math.floor(((checkOutTime - new Date(rental.checkInTime)) % (1000 * 60 * 60)) / (1000 * 60))
    },
    payment: {
      amount: 0, // Sẽ được cập nhật khi khách thanh toán
      change: 0, // Sẽ được cập nhật khi khách thanh toán
      method: 'cash', // Mặc định
      status: 'pending'
    }
  };
};

const checkCustomerActiveRental = async (customerId, transaction) => {
  const activeRental = await Rental.findOne({
    where: {
      customerId,
      status: 'active'
    },
    include: [{
      model: Room,
      as: 'room',
      attributes: ['number']
    }],
    transaction
  });

  if (activeRental) {
    throw new AppError(
      `Khách hàng này đang ở phòng ${activeRental.room.number}. Không thể thêm vào phòng khác.`,
      400
    );
  }
};

const updateCustomerRelations = async (mainCustomerId, additionalCustomerId, transaction) => {
  // Kiểm tra và tạo/cập nhật relation
  const [relation] = await CustomerRelation.findOrCreate({
    where: {
      [Op.or]: [
        { customerId: mainCustomerId, relatedCustomerId: additionalCustomerId },
        { customerId: additionalCustomerId, relatedCustomerId: mainCustomerId }
      ]
    },
    defaults: {
      customerId: mainCustomerId,
      relatedCustomerId: additionalCustomerId,
      frequency: 1
    },
    transaction
  });

  if (!relation.isNewRecord) {
    await relation.increment('frequency', { transaction });
  }
};

const rentalController = {
  create: catchAsync(async (req, res) => {
    const { 
      roomId,
      rentType,
      checkInTime,
      numberOfGuests,
      mainCustomer,
      drinks = []
    } = req.body;

    // Lấy userId từ người dùng đang đăng nhập
    const userId = req.user?.id;
    
    // Kiểm tra userId
    if (!userId) {
      throw new AppError('Không tìm thấy thông tin người dùng', 401);
    }

    console.log(`Creating rental with userId: ${userId}`);

    try {
      const result = await sequelize.transaction(async (t) => {
        // Kiểm tra room có tồn tại và available
        const room = await Room.findOne({
          where: { 
            id: roomId,
            status: 'available',
            active: true
          },
          include: ['type'],
          transaction: t
        });

        if (!room) {
          throw new AppError('Phòng không tồn tại hoặc không khả dụng', 404);
        }

        // Tạo hoặc lấy thông tin khách hàng
        let customer;
        if (mainCustomer.isWalkIn) {
          // Tạo carNumber với timestamp cho khách bộ hành
          const walkInId = `WALK-IN-${Date.now()}`;
          customer = await Customer.create({
            carNumber: walkInId,
            isWalkIn: true,
            visitCount: 1,
            lastVisit: new Date()
          }, { transaction: t });
        } else {
          if (!mainCustomer.carNumber) {
            throw new AppError('Vui lòng nhập biển số xe', 400);
          }

          // Nếu có customerId, lấy thông tin khách hàng
          if (mainCustomer.customerId) {
            customer = await Customer.findByPk(mainCustomer.customerId, { transaction: t });
            
            // Kiểm tra xem khách hàng có đang thuê phòng nào khác không
            await checkCustomerActiveRental(customer.id, t);
            
            await customer.update({
              visitCount: customer.visitCount + 1,
              lastVisit: new Date()
            }, { transaction: t });
          } else {
            // Tạo khách hàng mới nếu không có
            customer = await Customer.create({
              carNumber: mainCustomer.carNumber.toUpperCase(),
              visitCount: 1,
              lastVisit: new Date(),
              isWalkIn: false
            }, { transaction: t });
          }
        }

        // Tạo rental với carNumber đã được xử lý và thêm userId
        const rental = await Rental.create({
          roomId,
          customerId: customer.id,
          carNumber: customer.carNumber, // Sẽ là WALK-IN-timestamp cho khách bộ hành
          numberOfGuests,
          checkInTime: checkInTime,
          rentType: rentType,
          status: 'active',
          checkInDate: new Date(),
          isWalkIn: mainCustomer.isWalkIn,
          userId: userId // Thêm userId vào rental
        }, { transaction: t });

        console.log(`Created rental with id: ${rental.id}, userId: ${rental.userId}`);

        // Thêm đồ uống nếu có
        if (drinks.length > 0) {
          // Lấy thông tin chi tiết của tất cả đồ uống
          const drinkDetails = await Drink.findAll({
            where: {
              id: drinks.map(d => d.drinkId),
              active: true
            },
            transaction: t
          });

          if (drinkDetails.length !== drinks.length) {
            throw new AppError('Một số đồ uống không tồn tại hoặc không khả dụng', 400);
          }

          // Kiểm tra số lượng tồn kho và tạo rental drinks
          await Promise.all(drinks.map(async (drink) => {
            const drinkInfo = drinkDetails.find(d => d.id === drink.drinkId);
            if (!drinkInfo) {
              throw new AppError(`Không tìm thấy thông tin đồ uống`, 400);
            }

            if (drinkInfo.getTotalUnits() < drink.quantity) {
              throw new AppError(`Đồ uống ${drinkInfo.name} không đủ số lượng trong kho`, 400);
            }

            // Tạo rental drink
            await RentalDrink.create({
              rentalId: rental.id,
              drinkId: drink.drinkId,
              name: drinkInfo.name,
              quantity: drink.quantity,
              price: drinkInfo.sellingPrice
            }, { transaction: t });

            // Cập nhật stock
            await drinkInfo.decrement('unitStock', {
              by: drink.quantity,
              transaction: t
            });
          }));
        }

        // Cập nhật trạng thái phòng
        await room.update({ 
          status: 'occupied' 
        }, { transaction: t });

        // Load thông tin đầy đủ của rental
        const fullRental = await Rental.findByPk(rental.id, {
          include: [
            {
              model: Room,
              as: 'room',
              include: ['type']
            },
            {
              model: Customer,
              as: 'customer'
            },
            {
              model: RentalDrink,
              as: 'drinks'
            }
          ],
          transaction: t
        });

        return fullRental;
      });

      res.status(201).json({
        status: 'success',
        data: result
      });

    } catch (error) {
      throw error;
    }
  }),

  calculateCheckout: catchAsync(async (req, res) => {
    const { 
      rentalId, 
      checkoutTime,
      additionalCharges = 0,
      discount = 0,
      payment = {
        amount: 0,
        method: 'cash'
      }
    } = req.body;

    const rental = await Rental.findByPk(rentalId, {
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: RentalDrink,
          as: 'drinks'
        }
      ]
    });

    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    // Sử dụng thời gian checkout được chỉ định hoặc thời gian hiện tại
    const checkOutDateTime = checkoutTime ? new Date(checkoutTime) : new Date();
    
    // Validate thời gian checkout
    const checkInTime = new Date(rental.checkInTime);
    if (checkOutDateTime < checkInTime) {
      throw new AppError('Thời gian checkout không thể sớm hơn thời gian checkin', 400);
    }

    // Tính toán chi phí với logic mới
    const result = await calculateRentalCharges(
      rental, 
      checkOutDateTime, 
      additionalCharges,
      discount
    );

    // Tính toán tiền thừa nếu có thanh toán
    if (payment.amount > 0) {
      const change = Math.max(0, payment.amount - result.charges.final);
      result.payment = {
        amount: payment.amount,
        change: change,
        method: payment.method,
        status: 'pending'
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        rentalId: rental.id,
        checkOutTime: checkOutDateTime.toISOString(),
        ...result
      }
    });
  }),

  checkout: catchAsync(async (req, res) => {
    const { 
      rentalId, 
      additionalCharges = 0, 
      discount = 0,
      note = '', 
      payment_method = 'cash',
      customerPayment = 0,
      checkoutTime 
    } = req.body;

    // Lấy userId từ người dùng đang đăng nhập
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Không tìm thấy thông tin người dùng', 401);
    }

    const result = await sequelize.transaction(async (t) => {
      const rental = await Rental.findByPk(rentalId, {
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          }
        ],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
      }

      // Sử dụng checkoutTime từ request hoặc thời gian hiện tại
      const checkOutDateTime = checkoutTime ? new Date(checkoutTime) : new Date();
      
      // Validate thời gian checkout
      const checkInTime = new Date(rental.checkInTime);
      if (checkOutDateTime < checkInTime) {
        throw new AppError('Thời gian checkout không thể sớm hơn thời gian checkin', 400);
      }

      // Tính toán chi phí cuối cùng
      const { charges, duration } = await calculateRentalCharges(
        rental, 
        checkOutDateTime, 
        additionalCharges,
        discount
      );

      // Tính tiền thừa
      const change = Math.max(0, customerPayment - charges.final);

      // Xác định trạng thái thanh toán
      const payment_status = customerPayment >= charges.final ? 'completed' : 'pending';

      // Cập nhật rental với thông tin mới
      await rental.update({
        status: 'completed',
        checkOutTime: checkOutDateTime.toISOString(),
        checkOutDate: checkOutDateTime,
        charges: charges,
        duration: duration,
        totalAmount: charges.final, // Thêm totalAmount
        payment: {
          amount: customerPayment,
          change: change,
          method: payment_method,
          status: payment_status
        },
        payment_method, // Cập nhật payment_method
        payment_status, // Cập nhật payment_status
        note,
        userId: userId, // Cập nhật userId với người dùng đang đăng nhập
        // Lưu lại thông tin thay đổi rentType nếu có
        ...(charges.room.autoChanged && {
          rentType: charges.room.changedTo,
          previousRentType: charges.room.previousType
        })
      }, { transaction: t });

      // Cập nhật trạng thái phòng
      await rental.room.update({ 
        status: 'cleaning' 
      }, { transaction: t });

      // Cập nhật customer relations khi checkout
      if (rental.additionalCars?.length > 0) {
        const mainCustomerId = rental.customerId;
        
        for (const additionalCar of rental.additionalCars) {
          if (!additionalCar.isWalkIn && additionalCar.customerId !== mainCustomerId) {
            await updateCustomerRelations(mainCustomerId, additionalCar.customerId, t);
          }
        }
      }

      // Load thông tin đầy đủ của rental sau khi cập nhật
      const updatedRental = await Rental.findByPk(rental.id, {
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalDrink,
            as: 'drinks'
          }
        ],
        transaction: t
      });

      return updatedRental;
    });

    res.status(200).json({
      status: 'success',
      data: {
        rental: result,
        message: 'Checkout thành công'
      }
    });
  }),

  addAdditionalCar: catchAsync(async (req, res) => {
    const { rentalId } = req.params;
    const { carNumber, isWalkIn, numberOfNewGuests } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const rental = await Rental.findOne({
        where: { 
          id: rentalId,
          status: 'active'
        },
        include: [{
          model: RentalAdditionalCar,
          as: 'additionalCars',
          where: {
            isWalkIn: true
          },
          required: false
        }],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng hoặc phòng đã checkout', 404);
      }

      // Kiểm tra số lượng khách bộ hành hiện tại
      const currentWalkInCount = rental.additionalCars?.filter(car => car.isWalkIn)?.length || 0;

      // Nếu là khách bộ hành và đã có khách bộ hành khác
      if (isWalkIn && currentWalkInCount > 0) {
        throw new AppError('Phòng này đã có khách bộ hành', 400);
      }

      // Tạo carNumber mới cho khách bộ hành
      const finalCarNumber = isWalkIn ? `WALK-IN-${Date.now()}` : carNumber.toUpperCase();

      // Kiểm tra xe thường đã được thêm chưa
      if (!isWalkIn) {
        const existingCar = await RentalAdditionalCar.findOne({
          where: { 
            rentalId,
            carNumber: finalCarNumber
          },
          transaction: t
        });

        if (existingCar) {
          throw new AppError('Xe này đã được thêm vào phòng', 400);
        }
      }

      // Tạo customer mới
      let customer;
      if (isWalkIn) {
        customer = await Customer.create({
          carNumber: finalCarNumber,
          isWalkIn: true,
          visitCount: 1,
          lastVisit: new Date()
        }, { transaction: t });
      } else {
        if (!carNumber) {
          throw new AppError('Vui lòng nhập biển số xe', 400);
        }

        customer = await Customer.findOne({
          where: { carNumber: carNumber.toUpperCase() },
          transaction: t
        });

        if (customer) {
          // Chỉ kiểm tra active rental nếu customer đã tồn tại
          await checkCustomerActiveRental(customer.id, t);
          
          await customer.update({
            visitCount: customer.visitCount + 1,
            lastVisit: new Date()
          }, { transaction: t });
        } else {
          customer = await Customer.create({
            carNumber: carNumber.toUpperCase(),
            visitCount: 1,
            lastVisit: new Date()
          }, { transaction: t });
        }
      }

      // Thêm xe phụ với carNumber đã được xử lý
      const additionalCar = await RentalAdditionalCar.create({
        rentalId,
        carNumber: finalCarNumber,
        customerId: customer.id,
        isWalkIn,
        numberOfNewGuests: numberOfNewGuests || 1
      }, { transaction: t });

      return { additionalCar, customer };
    });

    res.status(201).json({
      status: 'success',
      data: {
        carNumber: result.additionalCar.carNumber,
        customerInfo: {
          id: result.customer.id,
          fullName: result.customer.fullName || '',
          carNumber: result.customer.carNumber,
          visitCount: result.customer.visitCount,
          isWalkIn: result.customer.isWalkIn
        },
        addedAt: result.additionalCar.createdAt
      }
    });
  }),

  removeAdditionalCar: catchAsync(async (req, res) => {
    const { rentalId, carId } = req.params;

    await sequelize.transaction(async (t) => {
      const additionalCar = await RentalAdditionalCar.findOne({
        where: { 
          id: carId,
          rentalId
        },
        transaction: t
      });

      if (!additionalCar) {
        throw new AppError('Không tìm thấy thông tin xe phụ', 404);
      }

      await additionalCar.destroy({ transaction: t });
    });

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa xe phụ thành công'
    });
  }),

  addDrinks: catchAsync(async (req, res) => {
    const { rentalId } = req.params;
    const { drinkId, name, quantity, price } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const rental = await Rental.findOne({
        where: { 
          id: rentalId,
          status: 'active'
        },
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalAdditionalCar,
            as: 'additionalCars',
            include: ['customer']
          }
        ],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng hoặc phòng đã checkout', 404);
      }

      // Kiểm tra và cập nhật stock
      const drink = await Drink.findByPk(drinkId, { transaction: t });
      if (!drink || drink.getTotalUnits() < quantity) {
        throw new AppError(`Đồ uống ${name} không đủ số lượng trong kho`, 400);
      }

      // Kiểm tra xem đồ uống đã tồn tại chưa
      const existingDrink = await RentalDrink.findOne({
        where: {
          rentalId: rental.id,
          [Op.or]: [
            { drinkId: drinkId },
            { name: name }
          ]
        },
        transaction: t
      });

      let rentalDrink;
      if (existingDrink) {
        // Nếu đã tồn tại, tăng số lượng
        rentalDrink = await existingDrink.update({
          quantity: existingDrink.quantity + quantity,
          drinkId: drinkId || existingDrink.drinkId
        }, { transaction: t });
      } else {
        // Nếu chưa tồn tại, tạo mới
        rentalDrink = await RentalDrink.create({
          rentalId: rental.id,
          drinkId,
          name,
          quantity,
          price
        }, { transaction: t });
      }

      // Cập nhật stock
      await Drink.decrement('unitStock', {
        by: quantity,
        where: { id: drinkId },
        transaction: t
      });

      // Lấy thông tin rental đã cập nhật với đầy đủ relations
      const updatedRental = await Rental.findByPk(rental.id, {
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalAdditionalCar,
            as: 'additionalCars',
            include: ['customer']
          }
        ],
        transaction: t
      });

      // Refresh drink data sau khi update stock
      await drink.reload({ transaction: t });

      return {
        rental: updatedRental,
        drinkStock: {
          id: drink.id,
          unitStock: drink.unitStock,
          packStock: drink.packStock,
          unitsPerPack: drink.unitsPerPack,
          totalUnits: drink.getTotalUnits()
        }
      };
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  getRentalDetails: catchAsync(async (req, res) => {
    const rental = await Rental.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: RentalDrink,
          as: 'drinks'
        },
        {
          model: RentalAdditionalCar,
          as: 'additionalCars',
          include: ['customer']
        }
      ]
    });

    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    res.status(200).json({
      status: 'success',
      data: rental
    });
  }),

  getActiveRentals: catchAsync(async (req, res) => {
    const rentals = await Rental.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: RentalDrink,
          as: 'drinks'
        },
        {
          model: RentalAdditionalCar,
          as: 'additionalCars',
          include: ['customer']
        }
      ],
      order: [['checkInDate', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      data: rentals
    });
  }),

  getRentalHistory: catchAsync(async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate, roomNumber, status, search } = req.query;
    
    let where = {
      status: { [Op.ne]: 'active' }
    };

    // Thêm filter theo số phòng
    if (roomNumber) {
      const room = await Room.findOne({ 
        where: { 
          number: roomNumber,
          active: true 
        } 
      });
      if (room) {
        where.roomId = room.id;
      }
    }

    if (startDate && endDate) {
      where.checkInDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { carNumber: { [Op.iLike]: `%${search}%` } },
          { '$customer.fullName$': { [Op.iLike]: `%${search}%` } },
          { '$room.number$': { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { rows: rentals, count } = await Rental.findAndCountAll({
      where,
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: RentalDrink,
          as: 'drinks'
        },
        {
          model: RentalAdditionalCar,
          as: 'additionalCars',
          include: ['customer']
        }
      ],
      order: [['checkOutDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.status(200).json({
      status: 'success',
      data: {
        rentals,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  }),

  updateDrinkQuantity: catchAsync(async (req, res) => {
    const { rentalId, drinkId } = req.params;
    const { change } = req.body; // change có thể là 1 hoặc -1

    const result = await sequelize.transaction(async (t) => {
      const rental = await Rental.findOne({
        where: { 
          id: rentalId,
          status: 'active'
        },
        include: [{
          model: RentalDrink,
          as: 'drinks'
        }],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
      }

      const rentalDrink = await RentalDrink.findOne({
        where: {
          id: drinkId,
          rentalId: rentalId
        },
        transaction: t
      });

      if (!rentalDrink) {
        throw new AppError('Không tìm thấy đồ uống trong hóa đơn', 404);
      }

      // Lấy thông tin đồ uống từ bảng Drink
      const drink = await Drink.findByPk(rentalDrink.drinkId, { transaction: t });
      if (!drink) {
        throw new AppError('Không tìm thấy thông tin đồ uống', 404);
      }

      // Kiểm tra số lượng sau khi thay đổi
      const newQuantity = rentalDrink.quantity + change;
      if (newQuantity < 0) {
        throw new AppError('Số lượng không thể âm', 400);
      }

      // Kiểm tra stock khi tăng số lượng
      if (change > 0 && drink.getTotalUnits() < change) {
        throw new AppError(`Đồ uống ${drink.name} không đủ số lượng trong kho`, 400);
      }

      // Cập nhật stock trong bảng Drink
      if (change > 0) {
        // Nếu tăng số lượng, giảm stock
        await drink.decrement('unitStock', {
          by: change,
          transaction: t
        });
      } else {
        // Nếu giảm số lượng, tăng stock
        await drink.increment('unitStock', {
          by: Math.abs(change),
          transaction: t
        });
      }

      // Refresh drink data sau khi update stock
      await drink.reload({ transaction: t });

      if (newQuantity === 0) {
        await rentalDrink.destroy({ transaction: t });
      } else {
        await rentalDrink.update({ 
          quantity: newQuantity 
        }, { transaction: t });
      }

      // Lấy lại thông tin rental đã cập nhật
      const updatedRental = await Rental.findOne({
        where: { id: rentalId },
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: RentalAdditionalCar,
            as: 'additionalCars',
            include: ['customer']
          }
        ],
        transaction: t
      });

      return {
        rental: updatedRental,
        drinkStock: {
          id: drink.id,
          unitStock: drink.unitStock,
          packStock: drink.packStock,
          unitsPerPack: drink.unitsPerPack,
          totalUnits: drink.getTotalUnits()
        }
      };
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  getActiveByRoom: catchAsync(async (req, res) => {
    const { roomId } = req.params;

    const rental = await Rental.findOne({
      where: { 
        roomId,
        status: 'active'
      },
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: RentalDrink,
          as: 'drinks'
        },
        {
          model: RentalAdditionalCar,
          as: 'additionalCars',
          include: ['customer']
        }
      ]
    });

    if (!rental) {
      throw new AppError('Không tìm thấy thông tin thuê phòng', 404);
    }

    res.status(200).json({
      status: 'success',
      data: rental
    });
  }),

  getRoomHistory: catchAsync(async (req, res) => {
    const { roomId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    let where = {
      roomId,
      status: { [Op.ne]: 'active' }
    };

    if (startDate && endDate) {
      where.checkInDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { rows: rentals, count } = await Rental.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: RentalDrink,
          as: 'drinks'
        }
      ],
      order: [['checkOutDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.status(200).json({
      status: 'success',
      data: rentals,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  }),

  getDailyStatistics: catchAsync(async (req, res) => {
    const { date = new Date() } = req.query;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const rentals = await Rental.findAll({
      where: {
        checkOutDate: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: RentalDrink,
          as: 'drinks'
        }
      ]
    });

    const statistics = {
      date: startDate,
      totalRevenue: 0,
      roomRevenue: 0,
      drinkRevenue: 0,
      additionalRevenue: 0,
      rentalCount: rentals.length,
      byRoomType: {}
    };

    rentals.forEach(rental => {
      statistics.totalRevenue += parseFloat(rental.totalAmount || 0);
      statistics.roomRevenue += parseFloat(rental.charges.room.amount || 0);
      statistics.drinkRevenue += parseFloat(rental.charges.drinks || 0);
      statistics.additionalRevenue += parseFloat(rental.charges.additional || 0);

      const roomType = rental.room.type.name;
      if (!statistics.byRoomType[roomType]) {
        statistics.byRoomType[roomType] = {
          count: 0,
          revenue: 0
        };
      }
      statistics.byRoomType[roomType].count++;
      statistics.byRoomType[roomType].revenue += parseFloat(rental.charges.room.amount || 0);
    });

    res.status(200).json({
      status: 'success',
      data: statistics
    });
  }),

  getMonthlyStatistics: catchAsync(async (req, res) => {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const rentals = await Rental.findAll({
      where: {
        checkOutDate: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      include: [
        {
          model: Room,
          as: 'room',
          include: ['type']
        },
        {
          model: RentalDrink,
          as: 'drinks'
        }
      ]
    });

    const statistics = {
      month,
      year,
      totalRevenue: 0,
      roomRevenue: 0,
      drinkRevenue: 0,
      additionalRevenue: 0,
      rentalCount: rentals.length,
      byRoomType: {},
      dailyStats: {}
    };

    rentals.forEach(rental => {
      const day = new Date(rental.checkOutDate).getDate();
      
      // Tổng thống kê
      statistics.totalRevenue += parseFloat(rental.totalAmount || 0);
      statistics.roomRevenue += parseFloat(rental.charges.room.amount || 0);
      statistics.drinkRevenue += parseFloat(rental.charges.drinks || 0);
      statistics.additionalRevenue += parseFloat(rental.charges.additional || 0);

      // Thống kê theo loại phòng
      const roomType = rental.room.type.name;
      if (!statistics.byRoomType[roomType]) {
        statistics.byRoomType[roomType] = {
          count: 0,
          revenue: 0
        };
      }
      statistics.byRoomType[roomType].count++;
      statistics.byRoomType[roomType].revenue += parseFloat(rental.charges.room.amount || 0);

      // Thống kê theo ngày
      if (!statistics.dailyStats[day]) {
        statistics.dailyStats[day] = {
          total: 0,
          count: 0
        };
      }
      statistics.dailyStats[day].total += parseFloat(rental.totalAmount || 0);
      statistics.dailyStats[day].count++;
    });

    res.status(200).json({
      status: 'success',
      data: statistics
    });
  }),

  deleteDrink: catchAsync(async (req, res) => {
    const { rentalId, drinkId } = req.params;

    const result = await sequelize.transaction(async (t) => {
      const rental = await Rental.findOne({
        where: { 
          id: rentalId,
          status: 'active'
        },
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalAdditionalCar,
            as: 'additionalCars',
            include: ['customer']
          }
        ],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng hoặc phòng đã checkout', 404);
      }

      // Tìm drink cần xóa để lấy thông tin
      const drinkToDelete = await RentalDrink.findOne({
        where: {
          id: drinkId,
          rentalId: rental.id
        },
        transaction: t
      });

      if (!drinkToDelete) {
        throw new AppError('Không tìm thấy đồ uống trong hóa đơn', 404);
      }

      // Hoàn lại stock nếu có drinkId
      if (drinkToDelete.drinkId) {
        await Drink.increment('unitStock', {
          by: drinkToDelete.quantity,
          where: { id: drinkToDelete.drinkId },
          transaction: t
        });
      }

      // Xóa drink
      await drinkToDelete.destroy({ transaction: t });

      // Lấy thông tin rental đã cập nhật
      const updatedRental = await Rental.findByPk(rental.id, {
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: RentalAdditionalCar,
            as: 'additionalCars',
            include: ['customer']
          }
        ],
        transaction: t
      });

      return updatedRental;
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  updateSettings: catchAsync(async (req, res) => {
    const { id: rentalId } = req.params;
    const { rentType, numberOfGuests } = req.body;

    // Validate input
    if (!['hourly', 'halfday', 'overnight'].includes(rentType)) {
      throw new AppError('Hình thức thuê không hợp lệ', 400);
    }

    if (!numberOfGuests || numberOfGuests < 1 || numberOfGuests > 10) {
      throw new AppError('Số lượng khách không hợp lệ', 400);
    }

    const result = await sequelize.transaction(async (t) => {
      // Tìm và kiểm tra rental
      const rental = await Rental.findOne({
        where: { 
          id: rentalId,
          status: 'active'  // Chỉ cho phép cập nhật rental đang active
        },
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          }
        ],
        transaction: t
      });

      if (!rental) {
        throw new AppError('Không tìm thấy thông tin thuê phòng hoặc phòng đã checkout', 404);
      }

      // Cập nhật settings
      await rental.update({
        rentType,
        numberOfGuests
      }, { transaction: t });

      // Lấy thông tin rental đã cập nhật
      const updatedRental = await Rental.findByPk(rental.id, {
        include: [
          {
            model: Room,
            as: 'room',
            include: ['type']
          },
          {
            model: RentalDrink,
            as: 'drinks'
          },
          {
            model: Customer,
            as: 'customer'
          }
        ],
        transaction: t
      });

      return updatedRental;
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  estimatePrice: catchAsync(async (req, res) => {
    const { rentType, roomTypeId } = req.query;

    // Validate input
    if (!rentType || !roomTypeId) {
      throw new AppError('Thiếu thông tin rentType hoặc roomTypeId', 400);
    }

    if (!['hourly', 'halfday', 'overnight'].includes(rentType)) {
      throw new AppError('Hình thức thuê không hợp lệ', 400);
    }

    try {
      const priceService = await PriceCalculationService.initialize();
      const estimate = await priceService.estimateCalculation(rentType, roomTypeId);

      res.status(200).json({
        status: 'success',
        data: {
          ...estimate.data,
          rentType,
          roomTypeId
        }
      });
    } catch (error) {
      throw new AppError(error.message || 'Lỗi tính toán giá ước tính', error.statusCode || 500);
    }
  }),

  getRelatedCustomers: catchAsync(async (req, res) => {
    const { carNumber } = req.query;

    const customer = await Customer.findOne({
      where: { carNumber: carNumber.toUpperCase() }
    });

    if (!customer) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }

    // Sửa lại cách query và sắp xếp
    const relatedCustomers = await Customer.findAll({
      include: [{
        model: CustomerRelation,
        as: 'relations',
        where: {
          [Op.or]: [
            { customerId: customer.id },
            { relatedCustomerId: customer.id }
          ]
        },
        attributes: ['frequency'],
        required: true
      }],
      order: [[{ model: CustomerRelation, as: 'relations' }, 'frequency', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: relatedCustomers.map(c => ({
        id: c.id,
        carNumber: c.carNumber,
        fullName: c.fullName,
        frequency: c.relations[0]?.frequency || 0
      }))
    });
  }),

  getRoomFrequencyStats: catchAsync(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy tất cả các phòng và số lần sử dụng trong 30 ngày
    const rooms = await Room.findAll({
      where: {
        active: true
      },
      attributes: [
        'id',
        'number',
        'status',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM rentals
            WHERE rentals.roomId = Room.id
            AND rentals.checkInDate >= '${thirtyDaysAgo.toISOString()}'
            AND rentals.status = 'completed'
          )`),
          'usageCount'
        ],
        [
          sequelize.literal(`(
            SELECT MAX(rentals.checkOutDate)
            FROM rentals
            WHERE rentals.roomId = Room.id
            AND rentals.status = 'completed'
          )`),
          'lastUsed'
        ]
      ],
      include: [{
        model: Rental,
        as: 'currentRental',
        attributes: ['status'],
        required: false
      }],
      order: [['number', 'ASC']]
    });

    // Tính toán tần suất dựa trên số lần sử dụng
    const roomStats = rooms.map(room => {
      const usageCount = parseInt(room.getDataValue('usageCount') || 0);
      let frequency;
      
      // Phân loại tần suất
      if (usageCount >= 20) {
        frequency = 'high';
      } else if (usageCount <= 5) {
        frequency = 'low';
      } else {
        frequency = 'medium';
      }

      return {
        id: room.id,
        number: room.number,
        frequency,
        usageCount,
        lastUsed: room.getDataValue('lastUsed'),
        currentStatus: room.status === 'occupied' ? 'Đang có khách' : 
                      room.status === 'cleaning' ? 'Đang dọn dẹp' :
                      room.status === 'maintenance' ? 'Đang bảo trì' : 
                      room.status === 'available' ? 'Sẵn sàng' : null
      };
    });

    res.status(200).json({
      status: 'success',
      rooms: roomStats
    });
  })
};

module.exports = rentalController; 