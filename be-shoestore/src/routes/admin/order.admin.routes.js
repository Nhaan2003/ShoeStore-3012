const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const validationMiddleware = require('../../middlewares/validation.middleware');

// Temporary controller functions
const orderAdminController = {
  getAllOrders: (req, res) => {
    res.json({ success: true, message: 'Get all orders' });
  },
  getOrderById: (req, res) => {
    res.json({ success: true, message: 'Get order by ID' });
  },
  updateOrderStatus: (req, res) => {
    res.json({ success: true, message: 'Update order status' });
  },
  assignStaff: (req, res) => {
    res.json({ success: true, message: 'Assign staff to order' });
  }
};

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  ],
  validationMiddleware,
  orderAdminController.getAllOrders
);

router.get('/:orderId',
  [param('orderId').isInt()],
  validationMiddleware,
  orderAdminController.getOrderById
);

router.put('/:orderId/status',
  [
    param('orderId').isInt(),
    body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    body('notes').optional().isString()
  ],
  validationMiddleware,
  orderAdminController.updateOrderStatus
);

router.put('/:orderId/assign',
  [
    param('orderId').isInt(),
    body('staff_id').isInt()
  ],
  validationMiddleware,
  orderAdminController.assignStaff
);

module.exports = router;