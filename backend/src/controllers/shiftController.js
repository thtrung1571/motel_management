const { Shift, ShiftTransaction, User, Rental, Room } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return {
      hours: 0,
      minutes: 0
    };
  }
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        hours: 0,
        minutes: 0
      };
    }
    const diffInMinutes = Math.floor((end - start) / (1000 * 60));
    return {
      hours: Math.floor(diffInMinutes / 60),
      minutes: diffInMinutes % 60
    };
  } catch (error) {
    console.error('Error calculating duration:', error);
    return {
      hours: 0,
      minutes: 0
    };
  }
};

const shiftController = {
  // Bắt đầu ca làm việc mới
  startShift: catchAsync(async (req, res) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Không tìm thấy thông tin người dùng', 401);
    }

    console.log(`Creating shift with userId: ${userId}`);

    // Kiểm tra xem người dùng đã có ca làm việc đang mở chưa
    const existingOpenShift = await Shift.findOne({
      where: {
        userId: userId,
        endTime: null,
        status: 'active'
      }
    });

    if (existingOpenShift) {
      throw new AppError('Bạn đã có ca làm việc đang mở. Vui lòng kết thúc ca hiện tại trước khi bắt đầu ca mới', 400);
    }

    // Kiểm tra xem có ca làm việc nào đang hoạt động không
    const anyActiveShift = await Shift.findOne({
      where: {
        status: 'active'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'username']
      }]
    });

    if (anyActiveShift) {
      throw new AppError(`Hiện tại đã có ca làm việc đang hoạt động (${anyActiveShift.user.name}). Vui lòng đợi ca hiện tại kết thúc trước khi bắt đầu ca mới`, 400);
    }

    // Tạo ca làm việc mới
    const newShift = await Shift.create({
      userId: userId,
      startTime: new Date(),
      cashAmount: req.body.startCash || 0,
      status: 'active'
    });

    res.status(201).json({
      status: 'success',
      data: {
        shift: newShift
      }
    });
  }),

  // Kết thúc ca làm việc
  endShift: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { note } = req.body;

    console.log(`Ending shift for userId: ${userId}`);

    // Tìm ca làm việc hiện tại với tất cả giao dịch
    const activeShift = await Shift.findOne({
      where: {
        userId,
        status: 'active'
      },
      include: [{
        model: ShiftTransaction,
        as: 'transactions',
        include: [{
          model: Rental,
          as: 'rental',
          attributes: ['id', 'roomId', 'totalAmount', 'payment_method']
        }]
      }]
    });

    if (!activeShift) {
      throw new AppError('Không tìm thấy ca làm việc đang hoạt động cho bạn', 404);
    }

    // Kiểm tra xem có phòng nào đang được sử dụng không
    const occupiedRooms = await Room.count({
      where: {
        status: 'occupied'
      }
    });

    if (occupiedRooms > 0) {
      // Chỉ cảnh báo, không ngăn chặn việc kết thúc ca
      console.warn(`Cảnh báo: Có ${occupiedRooms} phòng đang được sử dụng khi kết thúc ca`);
    }

    // Tính tổng doanh thu và phân loại theo phương thức thanh toán
    const totals = activeShift.transactions.reduce((acc, transaction) => {
      if (transaction.method === 'cash') {
        acc.cashAmount += transaction.amount;
      } else {
        acc.bankingAmount += transaction.amount;
      }
      return acc;
    }, { cashAmount: 0, bankingAmount: 0 });

    // Cập nhật và kết thúc ca
    await activeShift.update({
      endTime: new Date(),
      status: 'completed',
      cashAmount: totals.cashAmount,
      bankingAmount: totals.bankingAmount,
      totalAmount: totals.cashAmount + totals.bankingAmount,
      note
    });

    console.log(`Shift ended successfully for userId: ${userId}, totals: ${JSON.stringify(totals)}`);

    res.status(200).json({
      status: 'success',
      data: {
        shift: {
          ...activeShift.toJSON(),
          totals
        }
      }
    });
  }),

  // Lấy thông tin ca làm việc hiện tại
  getCurrentShift: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const activeShift = await Shift.findOne({
      where: {
        userId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username']
        },
        {
          model: ShiftTransaction,
          as: 'transactions',
          include: [{
            model: Rental,
            as: 'rental',
            attributes: ['id', 'roomId', 'totalAmount', 'payment_method']
          }]
        }
      ]
    });

    if (!activeShift) {
      // Kiểm tra xem có ca làm việc nào đang hoạt động không
      const anyActiveShift = await Shift.findOne({
        where: {
          status: 'active'
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username']
        }]
      });

      if (anyActiveShift) {
        return res.status(200).json({
          status: 'success',
          data: null,
          message: `Hiện tại đã có ca làm việc đang hoạt động (${anyActiveShift.user.name}). Vui lòng đợi ca hiện tại kết thúc trước khi bắt đầu ca mới`
        });
      }

      return res.status(200).json({
        status: 'success',
        data: null
      });
    }

    // Tính thời gian làm việc
    const duration = calculateDuration(activeShift.startTime, new Date());

    res.status(200).json({
      status: 'success',
      data: {
        ...activeShift.toJSON(),
        duration
      }
    });
  }),

  // Lấy báo cáo ca làm việc hiện tại
  getCurrentShiftReport: catchAsync(async (req, res) => {
    const userId = req.user.id;

    // Tìm ca làm việc hiện tại
    const activeShift = await Shift.findOne({
      where: {
        userId,
        status: 'active'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'username']
      }]
    });

    if (!activeShift) {
      throw new AppError('Không tìm thấy ca làm việc đang hoạt động', 404);
    }

    // Lấy tất cả giao dịch trong ca
    const transactions = await ShiftTransaction.findAll({
      where: {
        shiftId: activeShift.id
      },
      include: [{
        model: Rental,
        as: 'rental',
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'checkOutTime', 'numberOfGuests', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${transactions.length} transactions for shift ${activeShift.id}`);
    if (transactions.length > 0) {
      console.log(`Transactions: ${JSON.stringify(transactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        isCrossShift: t.isCrossShift,
        rentalId: t.rentalId,
        roomNumber: t.roomNumber
      })))}`);
    }

    // Lấy các giao dịch xuyên ca - khách check-in ở ca trước nhưng chưa check-out
    const crossShiftCheckins = await ShiftTransaction.findAll({
      where: {
        type: 'checkin',
        status: 'processing',
        shiftId: { [Op.ne]: activeShift.id }
      },
      include: [{
        model: Rental,
        as: 'rental',
        where: {
          status: 'active'
        },
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'numberOfGuests', 'status']
      }]
    });

    // Lấy các giao dịch check-out xuyên ca - khách check-out ở ca hiện tại nhưng đã check-in ở ca trước
    const crossShiftCheckouts = await ShiftTransaction.findAll({
      where: {
        type: 'checkout',
        status: 'completed',
        shiftId: activeShift.id,
        isCrossShift: true
      },
      include: [{
        model: Rental,
        as: 'rental',
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'checkOutTime', 'numberOfGuests', 'status']
      }]
    });

    console.log(`Found ${crossShiftCheckouts.length} cross-shift checkouts for shift ${activeShift.id}`);
    if (crossShiftCheckouts.length > 0) {
      console.log(`Cross-shift checkouts: ${JSON.stringify(crossShiftCheckouts.map(c => ({
        id: c.id,
        rentalId: c.rentalId,
        roomNumber: c.roomNumber,
        amount: c.amount
      })))}`);
    }

    // Kết hợp tất cả các giao dịch xuyên ca
    const crossShiftTransactions = [...crossShiftCheckins, ...crossShiftCheckouts];

    console.log(`After fix: Found ${transactions.length} transactions in current shift`);
    console.log(`After fix: Found ${crossShiftCheckouts.length} cross-shift checkouts`);
    console.log(`After fix: Total transactions to calculate: ${transactions.length + crossShiftCheckouts.length}`);

    // Kết hợp tất cả các giao dịch trong ca hiện tại
    const allTransactions = transactions;

    // Lấy thông tin phòng
    const rooms = await Room.findAll({
      attributes: ['id', 'number', 'status', 'floor']
    });

    // Tính toán thống kê phòng
    const roomStats = {
      total: rooms.length,
      occupied: rooms.filter(room => room.status === 'occupied').length,
      cleaning: rooms.filter(room => room.status === 'cleaning').length,
      available: rooms.filter(room => room.status === 'available').length,
      maintenance: rooms.filter(room => room.status === 'maintenance').length
    };

    // Tính tổng doanh thu và phân loại theo phương thức thanh toán
    const totals = allTransactions.reduce((acc, transaction) => {
      console.log(`Transaction ${transaction.id}: type=${transaction.type}, amount=${transaction.amount}, method=${transaction.method}, isCrossShift=${transaction.isCrossShift}`);
      
      // Lấy thông tin chi tiết từ details
      const details = typeof transaction.details === 'string' 
        ? JSON.parse(transaction.details) 
        : transaction.details;
      
      // Sử dụng số tiền khách trả (customerPayment) nếu có, nếu không thì sử dụng amount
      const actualAmount = details?.customerPayment || transaction.amount;
      
      // Lấy tiền thối (nếu có)
      const change = details?.change || 0;
      
      if (transaction.method === 'cash') {
        acc.cashAmount += actualAmount;
        // Không cần trừ tiền thối vì đã được tính trong actualAmount
      } else {
        // Nếu là chuyển khoản và có tiền thối, thì tiền thối sẽ được trả bằng tiền mặt
        acc.bankingAmount += actualAmount;
        // Trừ tiền thối vào tổng tiền mặt
        acc.cashAmount -= change;
      }
      
      // Tổng doanh thu thực tế là số tiền khách trả trừ đi tiền thối
      acc.totalRevenue += (actualAmount - change);
      
      console.log(`After calculation - cashAmount: ${acc.cashAmount}, bankingAmount: ${acc.bankingAmount}, totalRevenue: ${acc.totalRevenue}, change: ${change}`);
      
      return acc;
    }, { cashAmount: 0, bankingAmount: 0, totalRevenue: 0 });

    console.log(`After fix: Total revenue calculated: ${totals.totalRevenue}, Cash: ${totals.cashAmount}, Banking: ${totals.bankingAmount}`);

    // Phân loại giao dịch theo loại
    const transactionsByType = {
      checkins: allTransactions.filter(t => t.type === 'checkin').length,
      checkouts: allTransactions.filter(t => t.type === 'checkout').length + crossShiftCheckouts.length,
      crossShiftCheckouts: crossShiftCheckouts.length,
      sameShiftCheckouts: allTransactions.filter(t => t.type === 'checkout' && !t.isCrossShift).length,
      completedCheckins: allTransactions.filter(t => t.type === 'checkin' && t.status === 'completed').length,
      processingCheckins: allTransactions.filter(t => t.type === 'checkin' && t.status === 'processing').length,
      totalAmount: totals.totalRevenue
    };

    // Thêm thông tin chi tiết về các giao dịch check-out xuyên ca
    const crossShiftCheckoutDetails = crossShiftCheckouts
      .map(t => {
        const details = typeof t.details === 'string' ? JSON.parse(t.details) : t.details;
        return {
          id: t.id,
          rentalId: t.rentalId,
          roomNumber: t.roomNumber,
          amount: t.amount,
          method: t.method,
          checkInShiftId: t.checkInShiftId,
          checkOutShiftId: t.checkOutShiftId,
          customerPayment: details?.customerPayment || t.amount,
          change: details?.change || 0,
          details: details
        };
      });

    // Thêm thông tin chi tiết về các giao dịch check-out trong cùng ca
    const sameShiftCheckoutDetails = allTransactions
      .filter(t => t.type === 'checkout' && !t.isCrossShift)
      .map(t => {
        const details = typeof t.details === 'string' ? JSON.parse(t.details) : t.details;
        return {
          id: t.id,
          rentalId: t.rentalId,
          roomNumber: t.roomNumber,
          amount: t.amount,
          method: t.method,
          checkInTime: t.rental?.checkInTime,
          checkOutTime: t.rental?.checkOutTime,
          status: t.status,
          customerPayment: details?.customerPayment || t.amount,
          change: details?.change || 0
        };
      });

    // Thêm thông tin chi tiết về các giao dịch check-in đã hoàn thành
    const completedCheckinDetails = allTransactions
      .filter(t => t.type === 'checkin' && t.status === 'completed')
      .map(t => ({
        id: t.id,
        rentalId: t.rentalId,
        roomNumber: t.roomNumber,
        status: t.status,
        rentalStatus: t.rental?.status,
        checkInTime: t.rental?.checkInTime,
        checkOutTime: t.rental?.checkOutTime
      }));

    // Thêm thông tin chi tiết về các giao dịch check-in đang xử lý
    const processingCheckinDetails = allTransactions
      .filter(t => t.type === 'checkin' && t.status === 'processing')
      .map(t => ({
        id: t.id,
        rentalId: t.rentalId,
        roomNumber: t.roomNumber,
        status: t.status,
        rentalStatus: t.rental?.status,
        checkInTime: t.rental?.checkInTime
      }));

    console.log(`Found ${crossShiftCheckoutDetails.length} cross-shift checkout details`);
    if (crossShiftCheckoutDetails.length > 0) {
      console.log(`Cross-shift checkout details: ${JSON.stringify(crossShiftCheckoutDetails.map(c => ({
        id: c.id,
        amount: c.amount,
        customerPayment: c.customerPayment,
        change: c.change,
        method: c.method
      })))}`);
    }

    console.log(`Found ${sameShiftCheckoutDetails.length} same-shift checkout details`);
    if (sameShiftCheckoutDetails.length > 0) {
      console.log(`Same-shift checkout details: ${JSON.stringify(sameShiftCheckoutDetails.map(c => ({
        id: c.id,
        amount: c.amount,
        customerPayment: c.customerPayment,
        change: c.change,
        method: c.method
      })))}`);
    }

    // Tính thời gian làm việc
    const duration = calculateDuration(activeShift.startTime, new Date());

    res.status(200).json({
      status: 'success',
      data: {
        shift: {
          id: activeShift.id,
          startTime: activeShift.startTime,
          duration
        },
        employee: activeShift.user,
        ...totals,
        transactions: allTransactions,
        crossShiftTransactions,
        transactionsByType,
        crossShiftCheckoutDetails,
        sameShiftCheckoutDetails,
        completedCheckinDetails,
        processingCheckinDetails,
        roomStats
      }
    });
  }),

  // Thêm method mới để admin xem tất cả ca làm việc
  getAllShifts: catchAsync(async (req, res) => {
    const { startDate, endDate, userId } = req.query;
    
    const where = {};
    
    // Lọc theo ngày nếu có
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Lọc theo user nếu có
    if (userId) {
      where.userId = userId;
    }

    const shifts = await Shift.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username']
        },
        {
          model: ShiftTransaction,
          as: 'transactions'
        }
      ],
      order: [['startTime', 'DESC']]
    });

    // Tính tổng cho mỗi ca
    const shiftsWithTotals = shifts.map(shift => {
      const transactions = shift.transactions || [];
      const totals = transactions.reduce((acc, t) => {
        if (t.method === 'cash') {
          acc.cashAmount += t.amount;
        } else {
          acc.bankingAmount += t.amount;
        }
        return acc;
      }, { cashAmount: 0, bankingAmount: 0 });

      return {
        ...shift.toJSON(),
        totalRevenue: totals.cashAmount + totals.bankingAmount,
        cashAmount: totals.cashAmount,
        bankingAmount: totals.bankingAmount
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        shifts: shiftsWithTotals
      }
    });
  }),

  // Lấy báo cáo tổng hợp của ca làm việc
  getShiftSummary: catchAsync(async (req, res) => {
    const { shiftId } = req.params;

    // Tìm ca làm việc
    const shift = await Shift.findByPk(shiftId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'username']
      }]
    });

    if (!shift) {
      throw new AppError('Không tìm thấy ca làm việc', 404);
    }

    // Lấy tất cả giao dịch trong ca
    const transactions = await ShiftTransaction.findAll({
      where: {
        shiftId
      },
      include: [{
        model: Rental,
        as: 'rental',
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'checkOutTime', 'numberOfGuests', 'status']
      }]
    });

    // Lấy các giao dịch check-out trong ca này nhưng check-in ở ca khác
    const crossShiftCheckouts = await ShiftTransaction.findAll({
      where: {
        checkOutShiftId: shiftId,
        isCrossShift: true
      },
      include: [{
        model: Rental,
        as: 'rental',
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'checkOutTime', 'numberOfGuests', 'status']
      }]
    });

    // Lấy các giao dịch check-in trong ca này nhưng check-out ở ca khác
    const crossShiftCheckins = await ShiftTransaction.findAll({
      where: {
        checkInShiftId: shiftId,
        isCrossShift: true
      },
      include: [{
        model: Rental,
        as: 'rental',
        attributes: ['id', 'roomId', 'customerId', 'checkInTime', 'checkOutTime', 'numberOfGuests', 'status']
      }]
    });

    // Tính tổng doanh thu và phân loại theo phương thức thanh toán
    const totals = transactions.reduce((acc, transaction) => {
      console.log(`Transaction ${transaction.id}: type=${transaction.type}, amount=${transaction.amount}, method=${transaction.method}, isCrossShift=${transaction.isCrossShift}`);
      
      if (transaction.method === 'cash') {
        acc.cashAmount += transaction.amount;
      } else {
        acc.bankingAmount += transaction.amount;
      }
      acc.totalRevenue += transaction.amount;
      return acc;
    }, { cashAmount: 0, bankingAmount: 0, totalRevenue: 0 });

    // Tính thời gian làm việc
    const duration = calculateDuration(shift.startTime, shift.endTime || new Date());

    res.status(200).json({
      status: 'success',
      data: {
        shift: {
          id: shift.id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          duration,
          status: shift.status
        },
        employee: shift.user,
        ...totals,
        transactions,
        crossShiftCheckouts,
        crossShiftCheckins,
        summary: {
          totalTransactions: transactions.length,
          crossShiftTransactions: crossShiftCheckouts.length + crossShiftCheckins.length,
          checkins: transactions.filter(t => t.type === 'checkin').length,
          checkouts: transactions.filter(t => t.type === 'checkout').length
        }
      }
    });
  })
};

module.exports = shiftController; 