const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');

// Validation rules
const createOrderValidation = [
    body('shippingName')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập tên người nhận'),
    body('shippingPhone')
        .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('shippingAddress')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập địa chỉ giao hàng'),
    body('paymentMethod')
        .optional()
        .isIn(['COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO']).withMessage('Phương thức thanh toán không hợp lệ')
];

const updateStatusValidation = [
    body('status')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
        .withMessage('Trạng thái không hợp lệ')
];

// User routes
router.post('/', authenticateToken, createOrderValidation, validate, orderController.createOrder);
router.get('/', authenticateToken, orderController.getMyOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);

// Admin/Staff routes
router.get('/admin/all', authenticateToken, isStaffOrAdmin, orderController.getAllOrders);
router.put('/:id/status', authenticateToken, isStaffOrAdmin, updateStatusValidation, validate, orderController.updateOrderStatus);

module.exports = router;
