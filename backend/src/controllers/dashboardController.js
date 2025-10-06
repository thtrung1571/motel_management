const { Rental, Customer, Room, RoomType } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const dashboardController = {
  getDashboardData: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tối ưu truy vấn bằng cách gộp các thống kê phòng
      const roomStatusCounts = await Room.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Lấy doanh thu
      const [totalRevenue, todayRevenue] = await Promise.all([
        Rental.sum('totalAmount'),
        Rental.sum('totalAmount', {
          where: {
            checkOutDate: { [Op.gte]: today }
          }
        })
      ]);

      // Lấy 10 giao dịch gần nhất
      const recentRentals = await Rental.findAll({
        limit: 10,
        order: [['checkOutDate', 'DESC']],
        attributes: ['id', 'totalAmount', 'checkOutDate', 'checkOutTime', 'carNumber'],
        include: [{
          model: Room,
          as: 'room',
          attributes: ['number'],
          required: true
        }]
      });

      // Format dữ liệu trả về
      const roomStats = roomStatusCounts.map(stat => ({
        name: stat.status,
        value: parseInt(stat.get('count'))
      }));

      res.json({
        data: {
          totalRevenue: totalRevenue || 0,
          todayRevenue: todayRevenue || 0,
          roomStats,
          recentRentals
        }
      });

    } catch (error) {
      console.error('Dashboard Error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  getDailyRevenue: async (req, res) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dailyRevenue = await Rental.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('checkOutDate')), 'date'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
        ],
        where: {
          checkOutDate: {
            [Op.gte]: sevenDaysAgo
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('checkOutDate'))],
        order: [[sequelize.fn('DATE', sequelize.col('checkOutDate')), 'DESC']],
        raw: true
      });

      res.json({
        data: dailyRevenue.map(item => ({
          ...item,
          revenue: parseFloat(item.revenue) || 0
        }))
      });

    } catch (error) {
      console.error('Daily Revenue Error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  getCustomerStats: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalCustomers, newCustomersToday] = await Promise.all([
        Customer.count(),
        Customer.count({
          where: {
            createdAt: { [Op.gte]: today }
          }
        })
      ]);

      res.json({
        data: {
          totalCustomers,
          newCustomersToday
        }
      });

    } catch (error) {
      console.error('Customer Stats Error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = dashboardController;
