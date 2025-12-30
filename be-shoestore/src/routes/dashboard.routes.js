const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// All routes require admin/staff authentication
router.use(authenticateToken);
router.use(isStaffOrAdmin);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/revenue', dashboardController.getRevenueChart);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/low-stock', dashboardController.getLowStockProducts);
router.get('/order-stats', dashboardController.getOrderStats);

module.exports = router;
