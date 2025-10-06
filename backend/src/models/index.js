const User = require('./User');
const RoomType = require('./RoomType');
const Room = require('./Room');
const { Rental, RentalDrink, RentalAdditionalCar } = require('./Rental');
const Drink = require('./Drink');
const { Customer, CustomerRelation } = require('./Customer');
const PriceLogic = require('./PriceLogic');
const { Shift, ShiftTransaction } = require('./Shift');

// Room relationships
Room.belongsTo(RoomType, {
  foreignKey: 'roomTypeId',
  as: 'type',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

RoomType.hasMany(Room, {
  foreignKey: 'roomTypeId',
  as: 'rooms',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Room-Rental relationships
Room.hasMany(Rental, {
  foreignKey: 'roomId',
  as: 'rentals',
  onDelete: 'RESTRICT'
});

Room.hasOne(Rental, {
  foreignKey: 'roomId',
  as: 'currentRental',
  scope: {
    status: 'active'
  },
  onDelete: 'RESTRICT'
});

// Rental relationships
Rental.belongsTo(Room, {
  foreignKey: 'roomId',
  as: 'room'
});

Rental.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});

// Rental - RentalDrink relationships
Rental.hasMany(RentalDrink, {
  foreignKey: 'rentalId',
  as: 'drinks'
});

RentalDrink.belongsTo(Rental, {
  foreignKey: 'rentalId'
});

// RentalDrink - Drink relationships
RentalDrink.belongsTo(Drink, {
  foreignKey: 'drinkId',
  as: 'drink'
});

Drink.hasMany(RentalDrink, {
  foreignKey: 'drinkId',
  as: 'rentalDrinks'
});

Rental.hasMany(RentalAdditionalCar, {
  foreignKey: 'rentalId',
  as: 'additionalCars'
});

// Additional Car relationships
RentalAdditionalCar.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});



// Customer-Rental relationship
Customer.hasMany(Rental, {
  foreignKey: 'customerId',
  as: 'rentals'
});

// Shift relationships
User.hasMany(Shift, {
  foreignKey: 'userId',
  as: 'shifts'
});

Shift.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ShiftTransaction relationships
ShiftTransaction.belongsTo(Rental, {
  foreignKey: 'rentalId',
  as: 'rental'
});

Rental.hasOne(ShiftTransaction, {
  foreignKey: 'rentalId',
  as: 'shiftTransaction'
});

// Export all models
module.exports = {
  User,
  RoomType,
  Room,
  Rental,
  RentalDrink,
  RentalAdditionalCar,
  Drink,
  Customer,
  CustomerRelation,
  PriceLogic,
  Shift,
  ShiftTransaction
}; 