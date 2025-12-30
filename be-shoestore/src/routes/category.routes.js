const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const { uploadSingleImage, handleMulterError } = require('../middlewares/upload.middleware');
const categoryController = require('../controllers/category.controller');

// Validation rules
const categoryValidation = [
    body('categoryName')
        .trim()
        .isLength({ min: 2 }).withMessage('Tên danh mục phải có ít nhất 2 ký tự')
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/flat', categoryController.getCategoriesFlat);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.post('/', 
    authenticateToken, 
    isAdmin, 
    uploadSingleImage.single('image'),
    handleMulterError,
    categoryValidation, 
    validate, 
    categoryController.createCategory
);

router.put('/:id', 
    authenticateToken, 
    isAdmin, 
    uploadSingleImage.single('image'),
    handleMulterError,
    categoryValidation, 
    validate, 
    categoryController.updateCategory
);

router.delete('/:id', authenticateToken, isAdmin, categoryController.deleteCategory);

module.exports = router;
