const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Set true nếu muốn xem SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Thêm các options cho MySQL nếu cần
      // timezone: '+07:00', // for writing to database
    }
  }
);

// Hàm test kết nối
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công.');
  } catch (error) {
    console.error('Không thể kết nối đến database:', error);
  }
};

module.exports = { sequelize, testConnection }; 