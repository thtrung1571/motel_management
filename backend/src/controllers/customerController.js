const { Customer, CustomerRelation, Rental, Room, RentalDrink } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const XLSX = require('xlsx');
const { sequelize } = require('../config/database');
const dayjs = require('dayjs');

const customerController = {
  getAllCustomers: catchAsync(async (req, res) => {
    const { search, page, limit } = req.query;

    try {
      // Build where clause
      let where = {};
      
      if (search && search.trim()) {
        where = {
          [Op.or]: [
            { carNumber: { [Op.like]: `%${search}%` } },
            { fullName: { [Op.like]: `%${search}%` } },
            { cccd: { [Op.like]: `%${search}%` } },
            { placeLiving: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: customers } = await Customer.findAndCountAll({
        where,
        include: [
          {
            model: Rental,
            as: 'rentals',
            required: false,
            include: [{
              model: Room,
              as: 'room',
              attributes: ['number'],
              required: false
            }],
            attributes: ['checkInDate', 'totalAmount', 'note', 'status', 'roomId'],
            limit: 5,
            order: [['checkInDate', 'DESC']],
            where: {
              status: 'completed'
            },
            separate: true
          },
          {
            model: Customer,
            as: 'relatedCustomers',
            required: false,
            through: {
              attributes: ['frequency']
            },
            attributes: ['id', 'carNumber', 'fullName']
          }
        ],
        order: [['lastVisit', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      // Format response data
      const formattedCustomers = customers.map(customer => {
        const customerJson = customer.toJSON();
        
        // Format rental history
        const rentalHistory = (customerJson.rentals || []).map(rental => ({
          date: dayjs(rental.checkInDate).format('DD/MM/YY'),
          roomNumber: rental.room?.number || '',
          totalAmount: rental.totalAmount?.toLocaleString('vi-VN') || '0',
          note: rental.note || ''
        }));

        // Format related customers
        const allRelatedCustomers = (customerJson.relatedCustomers || []).map(rc => ({
          id: rc.id,
          carNumber: rc.carNumber,
          fullName: rc.fullName,
          frequency: rc.CustomerRelation?.frequency || 0
        }));

        return {
          ...customerJson,
          rentalHistory,
          relatedCustomers: allRelatedCustomers,
          rentals: undefined
        };
      });

      res.status(200).json({
        status: 'success',
        total: count,
        customers: formattedCustomers
      });

    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      throw new AppError('Lỗi khi lấy danh sách khách hàng', 500);
    }
  }),

  getCustomerById: catchAsync(async (req, res) => {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      throw new AppError('Không tìm thấy khách hàng', 404);
    }
    res.json(customer);
  }),

  createCustomer: catchAsync(async (req, res) => {
    const customerData = {
      ...req.body,
      visitCount: 0,
      lastVisit: new Date()
    };

    try {
      // Kiểm tra biển số xe chỉ khi không phải khách bộ hành
      if (!customerData.carNumber.startsWith('WALK-IN-')) {
        const existingCustomer = await Customer.findOne({
          where: { carNumber: customerData.carNumber.toUpperCase() }
        });

        if (existingCustomer) {
          return res.status(400).json({
            status: 'fail',
            message: 'Biển số xe đã tồn tại trong hệ thống'
          });
        }
      }

      const customer = await Customer.create(customerData);
      
      // Trả về response với status success
      return res.status(201).json({
        status: 'success',
        message: 'Tạo khách hàng thành công',
        data: customer
      });

    } catch (error) {
      console.error('Error creating customer:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi khi tạo khách hàng mới'
      });
    }
  }),

  updateCustomer: catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Debug logs
    console.log('Update request:', { id, updateData });

    try {
      // Kiểm tra khách hàng tồn tại
      const existingCustomer = await Customer.findByPk(id);
      if (!existingCustomer) {
        return res.status(404).json({
          status: 'fail',
          message: 'Không tìm thấy khách hàng'
        });
      }

      // Kiểm tra biển số xe chỉ khi không phải khách bộ hành và biển số thay đổi
      if (!updateData.carNumber.startsWith('WALK-IN-')) {
        const duplicateCustomer = await Customer.findOne({
          where: { 
            carNumber: updateData.carNumber.toUpperCase(),
            id: { [Op.ne]: id }
          }
        });

        if (duplicateCustomer) {
          return res.status(400).json({
            status: 'fail',
            message: 'Biển số xe đã tồn tại trong hệ thống'
          });
        }
      }

      // Cập nhật thông tin
      await Customer.update(updateData, {
        where: { id }
      });

      // Lấy thông tin khách hàng sau khi cập nhật
      const updatedCustomer = await Customer.findByPk(id);
      
      // Debug log
      console.log('Updated customer:', updatedCustomer);
      
      return res.status(200).json({
        status: 'success',
        data: updatedCustomer
      });

    } catch (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi khi cập nhật thông tin khách hàng'
      });
    }
  }),

  deleteCustomer: catchAsync(async (req, res) => {
    const deleted = await Customer.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      throw new AppError('Không tìm thấy khách hàng', 404);
    }

    res.json({ message: 'Đã xóa khách hàng thành công' });
  }),

  importCustomers: catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Không tìm thấy file', 400);
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let customersData = [];

    try {
      // Xử lý file dựa trên định dạng
      if (fileExtension === 'json') {
        // Xử lý file JSON
        const fileContent = req.file.buffer.toString('utf8');
        try {
          const jsonData = JSON.parse(fileContent);
          customersData = Array.isArray(jsonData) ? jsonData : [];
        } catch (error) {
          throw new AppError('File JSON không hợp lệ', 400);
        }
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        // Xử lý file Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Đọc dữ liệu từ Excel
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        // Bỏ qua hàng tiêu đề nếu có
        const dataRows = rawData.length > 0 && typeof rawData[0].A === 'string' && 
                        (rawData[0].A.toLowerCase().includes('stt') || 
                         rawData[0].A.toLowerCase().includes('số thứ tự')) 
                        ? rawData.slice(1) : rawData;
        
        // Chuyển đổi dữ liệu Excel sang định dạng chuẩn
        customersData = dataRows.map(row => {
          return {
            "CCCD": row.D || '',
            "Họ tên": row.B || '',
            "Ngày sinh": row.C || '',
            "Địa chỉ": row.E || '',
            "Giới Tính": row.F || ''
          };
        });
      } else {
        throw new AppError('Định dạng file không được hỗ trợ', 400);
      }

      // Loại bỏ watermark nếu có
      customersData = customersData.filter(item => !item.watermark);

      if (!customersData.length) {
        throw new AppError('Không có dữ liệu khách hàng trong file', 400);
      }

      const results = {
        total: customersData.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Xử lý từng khách hàng
      for (let i = 0; i < customersData.length; i++) {
        try {
          const customerData = customersData[i];
          
          // Log dữ liệu để debug
          console.log(`Processing customer ${i + 1}:`, JSON.stringify(customerData));
          
          // Lấy dữ liệu từ các trường có thể có tên khác nhau
          const cccd = customerData.CCCD || customerData.cccd || customerData.D || '';
          const fullName = customerData["Họ tên"] || customerData.fullName || customerData.B || '';
          
          // Xử lý ngày sinh
          let birthDayStr = customerData["Ngày sinh"] || customerData.birthDay || customerData.C || '';
          let birthDay = null;
          
          // Xử lý giới tính
          const gender = customerData["Giới Tính"] || customerData.gender || customerData.F || '';
          
          // Xử lý địa chỉ - kiểm tra tất cả các khả năng
          const address = customerData["Địa chỉ"] || customerData.placeLiving || 
                          customerData.address || customerData["Địa Chỉ"] || customerData.E || '';
          
          console.log(`Extracted address: "${address}" from:`, JSON.stringify(customerData));
          
          // Kiểm tra dữ liệu bắt buộc
          if (!cccd || !fullName) {
            throw new Error(`Dòng ${i + 1}: CCCD và Họ tên là bắt buộc`);
          }

          // Xử lý ngày sinh
          if (birthDayStr) {
            // Hỗ trợ nhiều định dạng ngày
            if (typeof birthDayStr === 'string' && birthDayStr.includes('/')) {
              const [day, month, year] = birthDayStr.split('/');
              birthDay = new Date(year, month - 1, day);
            } else if (typeof birthDayStr === 'string' && birthDayStr.includes('-')) {
              birthDay = new Date(birthDayStr);
            } else if (birthDayStr instanceof Date) {
              birthDay = birthDayStr;
            } else if (typeof birthDayStr === 'number') {
              // Excel lưu ngày dưới dạng số
              birthDay = XLSX.SSF.parse_date_code(birthDayStr);
            }
            
            if (birthDay && isNaN(birthDay.getTime())) {
              birthDay = null;
            }
          }

          // Tạo carNumber từ CCCD nếu không có
          const carNumber = `WALK-IN-${cccd}`;

          // Kiểm tra khách hàng đã tồn tại
          const existingCustomer = await Customer.findOne({
            where: { cccd: cccd.toString().trim() }
          });

          // Chuẩn bị dữ liệu để lưu
          const customerToSave = {
            fullName: fullName.toString().trim(),
            birthDay: birthDay,
            gender: gender || null,
            placeLiving: address ? address.toString().trim() : null,
            active: true
          };
          
          console.log('Data to save:', customerToSave);

          if (existingCustomer) {
            // Cập nhật thông tin khách hàng hiện có
            await existingCustomer.update(customerToSave);
            results.updated++;
          } else {
            // Tạo khách hàng mới
            await Customer.create({
              ...customerToSave,
              cccd: cccd.toString().trim(),
              carNumber: carNumber,
              visitCount: 0,
              lastVisit: new Date()
            });
            results.created++;
          }
        } catch (error) {
          console.error(`Error processing customer ${i + 1}:`, error);
          results.skipped++;
          results.errors.push({
            row: i + 1,
            cccd: customersData[i].CCCD || customersData[i].cccd || customersData[i].D || 'Không có CCCD',
            error: error.message
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        message: `Đã nhập ${results.created} khách hàng mới, cập nhật ${results.updated} khách hàng hiện có, bỏ qua ${results.skipped} bản ghi`,
        data: results
      });

    } catch (error) {
      console.error('Import error:', error);
      throw new AppError(error.message || 'Lỗi khi xử lý file', 400);
    }
  }),

  getByCarNumber: catchAsync(async (req, res) => {
    const { carNumber } = req.params;
    
    const customer = await Customer.findOne({
      where: {
        carNumber: {
          [Op.iLike]: carNumber
        }
      }
    });

    if (!customer) {
      throw new AppError('Không tìm thấy thông tin khách hàng với biển số xe này', 404);
    }

    res.json(customer);
  }),

  getRelatedCustomers: catchAsync(async (req, res) => {
    const { carNumber } = req.query;

    // Tìm customer dựa trên biển số xe
    const customer = await Customer.findOne({
      where: { 
        carNumber: carNumber.toUpperCase() 
      }
    });

    if (!customer) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }

    // Tìm các khách hàng có quan hệ
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
        required: true
      }],
      where: {
        // Loại bỏ khách hàng chính và khách bộ hành
        id: { [Op.ne]: customer.id },
        carNumber: {
          [Op.notLike]: 'WALK-IN-%'
        }
      },
      order: [[{ model: CustomerRelation, as: 'relations' }, 'frequency', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: relatedCustomers.map(c => ({
        id: c.id,
        carNumber: c.carNumber,
        fullName: c.fullName,
        cccd: c.cccd,
        frequency: c.relations[0]?.frequency || 0
      }))
    });
  }),

  addRelatedCustomer: catchAsync(async (req, res) => {
    const { customerId, relatedCustomerId } = req.body;

    // Kiểm tra xem cả hai customer có tồn tại không
    const [customer, relatedCustomer] = await Promise.all([
      Customer.findByPk(customerId),
      Customer.findByPk(relatedCustomerId)
    ]);

    if (!customer || !relatedCustomer) {
      throw new AppError('Không tìm thấy một trong hai khách hàng', 404);
    }

    // Tìm hoặc tạo mối quan hệ
    const [relation, created] = await CustomerRelation.findOrCreate({
      where: {
        [Op.or]: [
          { customerId, relatedCustomerId },
          { customerId: relatedCustomerId, relatedCustomerId: customerId }
        ]
      },
      defaults: {
        customerId,
        relatedCustomerId,
        frequency: 1
      }
    });

    if (!created) {
      await relation.increment('frequency');
    }

    res.status(200).json({
      status: 'success',
      message: created ? 'Đã thêm mối quan hệ mới' : 'Đã cập nhật tần suất',
      data: relation
    });
  }),

  removeRelatedCustomer: catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const deleted = await CustomerRelation.destroy({
      where: {
        [Op.or]: [
          { id },
          { id }
        ]
      }
    });

    if (!deleted) {
      throw new AppError('Không tìm thấy mối quan hệ này', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa mối quan hệ'
    });
  }),

  searchCustomers: catchAsync(async (req, res) => {
    const { search } = req.query;

    try {
      if (!search || search.length < 2) {
        return res.status(200).json({
          status: 'success',
          suggestions: []
        });
      }

      const suggestions = await Customer.findAll({
        where: {
          [Op.or]: [
            { carNumber: { [Op.like]: `%${search}%` } },
            { fullName: { [Op.like]: `%${search}%` } },
            { cccd: { [Op.like]: `%${search}%` } }
          ]
        },
        attributes: ['id', 'carNumber', 'fullName', 'cccd', 'visitCount'],
        order: [['lastVisit', 'DESC']],
        limit: 5
      });

      res.status(200).json({
        status: 'success',
        suggestions: suggestions.map(s => ({
          id: s.id,
          carNumber: s.carNumber,
          fullName: s.fullName,
          cccd: s.cccd,
          visitCount: s.visitCount
        }))
      });

    } catch (error) {
      console.error('Error in searchCustomers:', error);
      throw new AppError('Lỗi khi tìm kiếm khách hàng', 500);
    }
  }),

  getCustomerDetails: catchAsync(async (req, res) => {
    const { id } = req.params;

    // Trước tiên lấy 5 rental gần nhất
    const recentRentals = await Rental.findAll({
      where: {
        customerId: id,
        status: 'completed',
        checkOutTime: {
          [Op.not]: null
        }
      },
      order: [['checkOutTime', 'DESC']],
      limit: 5
    });

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Rental,
          as: 'rentals',
          include: [{
            model: Room,
            as: 'room',
            attributes: ['number']
          }, {
            model: RentalDrink,
            as: 'drinks',
            attributes: ['name', 'quantity', 'price'],
            where: {
              name: {
                [Op.ne]: ''
              },
              price: {
                [Op.gt]: 0
              }
            },
            required: false
          }],
          where: {
            id: {
              [Op.in]: recentRentals.map(r => r.id)
            }
          },
          attributes: ['id', 'checkOutTime', 'totalAmount', 'note', 'rentType'],
          required: false
        },
        {
          model: Customer,
          as: 'relatedCustomers',
          through: {
            attributes: ['frequency']
          },
          attributes: ['id', 'carNumber', 'fullName']
        }
      ]
    });

    if (!customer) {
      throw new AppError('Không tìm thấy khách hàng', 404);
    }

    const customerJson = customer.toJSON();
    
    const formattedCustomer = {
      id: customerJson.id,
      carNumber: customerJson.carNumber,
      fullName: customerJson.fullName,
      cccd: customerJson.cccd,
      visitCount: customerJson.visitCount,
      rentalHistory: (customerJson.rentals || [])
        .sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime))
        .map(rental => ({
          date: dayjs(rental.checkOutTime),
          roomNumber: rental.room?.number || 'N/A',
          totalAmount: rental.totalAmount?.toLocaleString('vi-VN') || '0',
          note: rental.note || '',
          rentType: rental.rentType || 'hourly',
          drinks: (rental.drinks || []).map(drink => ({
            name: drink.name,
            quantity: drink.quantity,
            price: drink.price,
            total: drink.quantity * drink.price
          }))
        })),
      relatedCustomers: (customerJson.relatedCustomers || []).map(rc => ({
        id: rc.id,
        carNumber: rc.carNumber,
        fullName: rc.fullName,
        frequency: rc.CustomerRelation?.frequency || 0
      }))
    };

    res.status(200).json({
      status: 'success',
      customer: formattedCustomer
    });
  })
};

module.exports = customerController;
