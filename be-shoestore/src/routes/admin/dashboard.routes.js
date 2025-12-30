const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboard.controller');
const { query } = require('express-validator');
const validationMiddleware = require('../../middlewares/validation.middleware');

router.get('/statistics',
  [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ],
  validationMiddleware,
  dashboardController.getStatistics
);

router.get('/sales-chart',
  [
    query('period').optional().isIn(['week', 'month', 'year'])
  ],
  validationMiddleware,
  dashboardController.getSalesChart
);

router.get('/top-products',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validationMiddleware,
  dashboardController.getTopProducts
);

router.get('/customer-stats', dashboardController.getCustomerStats);

module.exports = router;