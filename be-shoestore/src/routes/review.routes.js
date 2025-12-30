const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const { uploadProductImages, handleMulterError } = require('../middlewares/upload.middleware');
const reviewController = require('../controllers/review.controller');

// Validation rules
const createReviewValidation = [
    body('productId')
        .isInt().withMessage('Sản phẩm không hợp lệ'),
    body('orderId')
        .isInt().withMessage('Đơn hàng không hợp lệ'),
    body('rating')
        .isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1 đến 5 sao'),
    body('comment')
        .optional()
        .trim()
];

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// User routes
router.post('/', 
    authenticateToken, 
    uploadProductImages.array('images', 5),
    handleMulterError,
    createReviewValidation, 
    validate, 
    reviewController.createReview
);
router.get('/reviewable', authenticateToken, reviewController.getReviewableProducts);

// Admin routes
router.get('/admin', authenticateToken, isAdmin, reviewController.getAllReviews);
router.put('/:id/status', authenticateToken, isAdmin, reviewController.updateReviewStatus);
router.put('/:id/reply', authenticateToken, isAdmin, reviewController.replyReview);

module.exports = router;
