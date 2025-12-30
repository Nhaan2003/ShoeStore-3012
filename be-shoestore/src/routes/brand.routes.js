const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const { uploadSingleImage, handleMulterError } = require('../middlewares/upload.middleware');
const brandController = require('../controllers/brand.controller');

// Validation rules
const brandValidation = [
    body('brandName')
        .trim()
        .isLength({ min: 2 }).withMessage('Tên thương hiệu phải có ít nhất 2 ký tự')
];

// Public routes
router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);

// Admin routes
router.post('/', 
    authenticateToken, 
    isAdmin, 
    uploadSingleImage.single('logo'),
    handleMulterError,
    brandValidation, 
    validate, 
    brandController.createBrand
);

router.put('/:id', 
    authenticateToken, 
    isAdmin, 
    uploadSingleImage.single('logo'),
    handleMulterError,
    brandValidation, 
    validate, 
    brandController.updateBrand
);

router.delete('/:id', authenticateToken, isAdmin, brandController.deleteBrand);

module.exports = router;
