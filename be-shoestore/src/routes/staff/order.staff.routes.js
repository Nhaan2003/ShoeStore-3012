const express = require('express');
const router = express.Router();
const orderStaffController = require('../../controllers/staff/order.staff.controller');
const { body, param, query } = require('express-validator');
const validationMiddleware = require('../../middlewares/validation.middleware');

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('search').optional().isString()
  ],
  validationMiddleware,
  orderStaffController.getOrders
);

router.get('/:orderId',
  [
    param('orderId').isInt()
  ],
  validationMiddleware,
  orderStaffController.getOrderById
);

router.put('/:orderId/status',
  [
    param('orderId').isInt(),
    body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    body('notes').optional().isString()
  ],
  validationMiddleware,
  orderStaffController.updateOrderStatus
);

router.post('/:orderId/notes',
  [
    param('orderId').isInt(),
    body('note').notEmpty()
  ],
  validationMiddleware,
  orderStaffController.addOrderNote
);

module.exports = router;