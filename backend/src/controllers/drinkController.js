const { Drink } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllDrinks = catchAsync(async (req, res) => {
  const drinks = await Drink.findAll({
    order: [['name', 'ASC']],
    where: { active: true }
  });
  
  res.status(200).json({
    status: 'success',
    data: drinks
  });
});

exports.getDrinkById = catchAsync(async (req, res) => {
  const drink = await Drink.findByPk(req.params.id);
  
  if (!drink || !drink.active) {
    throw new AppError('Không tìm thấy đồ uống', 404);
  }

  res.status(200).json({
    status: 'success',
    data: drink
  });
});

exports.getLowStock = catchAsync(async (req, res) => {
  const drinks = await Drink.findAll({
    where: {
      active: true,
      [Op.and]: [
        sequelize.literal('(pack_stock * units_per_pack + unit_stock) <= alert_threshold')
      ]
    }
  });

  res.status(200).json({
    status: 'success',
    data: drinks
  });
});

exports.updateStock = catchAsync(async (req, res) => {
  const { packStock, unitStock } = req.body;
  const drink = await Drink.findByPk(req.params.id);

  if (!drink || !drink.active) {
    throw new AppError('Không tìm thấy đồ uống', 404);
  }

  await drink.update({ packStock, unitStock });

  res.status(200).json({
    status: 'success',
    data: drink
  });
});

exports.createDrink = catchAsync(async (req, res) => {
  const { 
    name, 
    costPrice, 
    sellingPrice, 
    unitsPerPack, 
    packStock, 
    unitStock,
    alertThreshold 
  } = req.body;

  // Kiểm tra đồ uống đã tồn tại chưa
  const existingDrink = await Drink.findOne({ 
    where: { 
      name: name.trim(),
      active: true 
    } 
  });

  if (existingDrink) {
    throw new AppError('Đồ uống này đã tồn tại', 400);
  }

  // Validate giá
  if (sellingPrice < costPrice) {
    throw new AppError('Giá bán phải lớn hơn hoặc bằng giá nhập', 400);
  }

  const newDrink = await Drink.create({
    name: name.trim(),
    costPrice,
    sellingPrice,
    unitsPerPack: unitsPerPack || 24,
    packStock: packStock || 0,
    unitStock: unitStock || 0,
    alertThreshold: alertThreshold || 10
  });

  res.status(201).json({
    status: 'success',
    data: newDrink
  });
});

exports.updateDrink = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    costPrice, 
    sellingPrice, 
    unitsPerPack, 
    packStock, 
    unitStock,
    alertThreshold 
  } = req.body;

  const drink = await Drink.findByPk(id);
  if (!drink || !drink.active) {
    throw new AppError('Không tìm thấy đồ uống', 404);
  }

  // Kiểm tra tên mới có trùng với đồ uống khác không
  if (name && name !== drink.name) {
    const existingDrink = await Drink.findOne({ 
      where: { 
        name: name.trim(),
        id: { [Op.ne]: id },
        active: true
      }
    });
    if (existingDrink) {
      throw new AppError('Tên đồ uống này đã tồn tại', 400);
    }
  }

  // Validate giá nếu có cập nhật
  if (costPrice !== undefined && sellingPrice !== undefined && sellingPrice < costPrice) {
    throw new AppError('Giá bán phải lớn hơn hoặc bằng giá nhập', 400);
  }

  await drink.update({
    name: name?.trim(),
    costPrice,
    sellingPrice,
    unitsPerPack,
    packStock,
    unitStock,
    alertThreshold
  });

  res.status(200).json({
    status: 'success',
    data: drink
  });
});

exports.deleteDrink = catchAsync(async (req, res) => {
  const drink = await Drink.findByPk(req.params.id);
  
  if (!drink || !drink.active) {
    throw new AppError('Không tìm thấy đồ uống', 404);
  }

  // Soft delete
  await drink.update({ active: false });

  res.status(200).json({
    status: 'success',
    message: 'Đã xóa đồ uống thành công'
  });
});