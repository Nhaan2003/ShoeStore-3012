const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');

// Validation rules
const addToCartValidation = [
    body('variantId')
        .isInt().withMessage('Variant không hợp lệ'),
    body('quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

const updateCartValidation = [
    body('quantity')
        .isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

// All routes require authentication
router.use(authenticateToken);

router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.post('/items', addToCartValidation, validate, cartController.addToCart);
router.put('/items/:itemId', updateCartValidation, validate, cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
