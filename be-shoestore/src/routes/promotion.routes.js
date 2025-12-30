const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const promotionController = require('../controllers/promotion.controller');

// Validation rules
const createPromotionValidation = [
    body('code')
        .trim()
        .isLength({ min: 3 }).withMessage('Mã khuyến mãi phải có ít nhất 3 ký tự'),
    body('name')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập tên khuyến mãi'),
    body('discountType')
        .isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Loại giảm giá không hợp lệ'),
    body('discountValue')
        .isFloat({ min: 0 }).withMessage('Giá trị giảm phải là số dương'),
    body('startDate')
        .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    body('endDate')
        .isISO8601().withMessage('Ngày kết thúc không hợp lệ')
];

const verifyPromotionValidation = [
    body('code')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập mã khuyến mãi'),
    body('orderAmount')
        .isFloat({ min: 0 }).withMessage('Số tiền đơn hàng không hợp lệ')
];

// Public routes
router.get('/', promotionController.getActivePromotions);

// User routes
router.post('/verify', authenticateToken, verifyPromotionValidation, validate, promotionController.verifyPromotion);

// Admin routes
router.get('/admin', authenticateToken, isAdmin, promotionController.getAllPromotions);
router.post('/', authenticateToken, isAdmin, createPromotionValidation, validate, promotionController.createPromotion);
router.put('/:id', authenticateToken, isAdmin, promotionController.updatePromotion);
router.delete('/:id', authenticateToken, isAdmin, promotionController.deletePromotion);

module.exports = router;
