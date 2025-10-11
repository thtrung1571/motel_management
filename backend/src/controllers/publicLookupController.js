const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Customer, Rental, Room } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const formatLicensePlate = require('../utils/formatLicensePlate');

const formatDate = (value) => (value ? dayjs(value).format('YYYY-MM-DD') : null);

const sanitizeSuggestion = (customer) => ({
  id: customer.id,
  carNumber: formatLicensePlate(customer.carNumber, customer.isCarPlate),
  rawCarNumber: customer.carNumber,
  fullName: customer.fullName || '',
  cccd: customer.cccd || '',
  visitCount: customer.visitCount ?? 0,
  lastVisit: formatDate(customer.lastVisit)
});

const sanitizeHistoryEntry = (rental) => ({
  id: rental.id,
  date: formatDate(rental.checkOutDate || rental.updatedAt),
  checkOutTime: rental.checkOutTime || null,
  roomNumber: rental.room ? rental.room.number : null,
  rentType: rental.rentType || null,
  totalAmount: rental.totalAmount ?? null,
  note: rental.note || ''
});

const sanitizeCustomer = (customer, rentals) => ({
  id: customer.id,
  carNumber: formatLicensePlate(customer.carNumber, customer.isCarPlate),
  rawCarNumber: customer.carNumber,
  fullName: customer.fullName || '',
  cccd: customer.cccd || '',
  visitCount: customer.visitCount ?? 0,
  lastVisit: formatDate(customer.lastVisit),
  placeLiving: customer.placeLiving || '',
  note: customer.note || '',
  rentalHistory: rentals.map(sanitizeHistoryEntry)
});

const publicLookupController = {
  search: catchAsync(async (req, res) => {
    const { query } = req.query;

    if (!query || String(query).trim().length < 2) {
      return res.status(200).json({
        status: 'success',
        suggestions: []
      });
    }

    const suggestions = await Customer.findAll({
      where: {
        [Op.or]: [
          { carNumber: { [Op.like]: `%${query}%` } },
          { fullName: { [Op.like]: `%${query}%` } },
          { cccd: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'carNumber', 'isCarPlate', 'fullName', 'cccd', 'visitCount', 'lastVisit'],
      order: [['lastVisit', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      suggestions: suggestions.map(sanitizeSuggestion)
    });
  }),

  details: catchAsync(async (req, res) => {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      attributes: [
        'id',
        'carNumber',
        'isCarPlate',
        'fullName',
        'cccd',
        'visitCount',
        'lastVisit',
        'placeLiving',
        'note'
      ]
    });

    if (!customer) {
      throw new AppError('Không tìm thấy khách hàng', 404);
    }

    const rentals = await Rental.findAll({
      where: {
        customerId: id,
        status: 'completed'
      },
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['number']
        }
      ],
      order: [['checkOutDate', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      customer: sanitizeCustomer(customer, rentals)
    });
  })
};

module.exports = publicLookupController;
