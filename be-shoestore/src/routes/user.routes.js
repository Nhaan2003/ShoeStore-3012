const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middlewares/auth.middleware');
const { uploadSingleImage, handleMulterError } = require('../middlewares/upload.middleware');
const userController = require('../controllers/user.controller');

// Validation rules
const updateProfileValidation = [
    body('fullName')
        .trim()
        .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ')
];

const createStaffValidation = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ'),
    body('password')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('fullName')
        .trim()
        .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự')
];

// User routes
router.put('/profile', 
    authenticateToken, 
    uploadSingleImage.single('avatar'),
    handleMulterError,
    updateProfileValidation, 
    validate, 
    userController.updateProfile
);

// Admin routes
router.get('/', authenticateToken, isAdmin, userController.getUsers);
router.get('/:id', authenticateToken, isStaffOrAdmin, userController.getUserById);
router.post('/staff', authenticateToken, isAdmin, createStaffValidation, validate, userController.createStaff);
router.put('/:id', authenticateToken, isAdmin, userController.updateUser);
router.put('/:id/status', authenticateToken, isAdmin, userController.toggleUserStatus);
router.put('/:id/reset-password', authenticateToken, isAdmin, userController.resetPassword);
router.get('/:id/orders', authenticateToken, isStaffOrAdmin, userController.getUserOrders);

module.exports = router;
