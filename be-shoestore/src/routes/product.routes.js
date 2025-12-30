const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadProductImages, handleMulterError } = require('../middlewares/upload.middleware');
const productController = require('../controllers/product.controller');

// Validation rules
const createProductValidation = [
    body('productName')
        .trim()
        .isLength({ min: 2 }).withMessage('Tên sản phẩm phải có ít nhất 2 ký tự'),
    body('basePrice')
        .isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
    body('categoryId')
        .isInt().withMessage('Danh mục không hợp lệ'),
    body('brandId')
        .isInt().withMessage('Thương hiệu không hợp lệ'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'unisex']).withMessage('Giới tính không hợp lệ')
];

const variantValidation = [
    body('size').notEmpty().withMessage('Vui lòng nhập size'),
    body('color').notEmpty().withMessage('Vui lòng nhập màu'),
    body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Số lượng phải là số nguyên dương')
];

// Public routes
router.get('/', optionalAuth, productController.getProducts);
router.get('/:id', optionalAuth, productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);

// Admin routes
router.post('/', 
    authenticateToken, 
    isAdmin, 
    uploadProductImages.array('images', 10),
    handleMulterError,
    createProductValidation, 
    validate, 
    productController.createProduct
);

router.put('/:id', 
    authenticateToken, 
    isAdmin, 
    createProductValidation, 
    validate, 
    productController.updateProduct
);

router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct);

router.post('/:id/variants', 
    authenticateToken, 
    isAdmin, 
    variantValidation, 
    validate, 
    productController.addProductVariant
);

router.post('/:id/images', 
    authenticateToken, 
    isAdmin, 
    uploadProductImages.array('images', 10),
    handleMulterError,
    productController.uploadProductImages
);

module.exports = router;
