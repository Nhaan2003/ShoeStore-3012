const logger = require('../../utils/logger');

class DashboardController {
  async getStatistics(req, res) {
    try {
      // Temporary statistics
      const stats = {
        totalOrders: 150,
        totalRevenue: 45000000,
        totalProducts: 89,
        totalCustomers: 234,
        todayOrders: 12,
        todayRevenue: 3500000,
        pendingOrders: 5,
        processingOrders: 8
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSalesChart(req, res) {
    try {
      const { period = 'week' } = req.query;
      
      // Temporary chart data
      const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [2500000, 3200000, 2800000, 4100000, 3900000, 5200000, 4800000]
        }]
      };

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Get sales chart error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTopProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      // Temporary top products
      const topProducts = [
        { id: 1, name: 'Nike Air Max 270', sales: 45, revenue: 157500000 },
        { id: 2, name: 'Adidas Ultraboost 22', sales: 38, revenue: 159600000 },
        { id: 3, name: 'Puma RS-X', sales: 32, revenue: 89600000 }
      ];

      res.json({
        success: true,
        data: topProducts.slice(0, limit)
      });
    } catch (error) {
      logger.error('Get top products error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCustomerStats(req, res) {
    try {
      const stats = {
        newCustomersToday: 8,
        newCustomersThisWeek: 45,
        newCustomersThisMonth: 189,
        returningCustomers: 145,
        averageOrderValue: 2850000
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get customer stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();