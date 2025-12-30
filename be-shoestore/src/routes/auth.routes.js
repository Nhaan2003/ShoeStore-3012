const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

// Validation rules
const registerValidation = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('fullName')
        .trim()
        .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ')
];

const loginValidation = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu')
];

const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/admin/login', loginValidation, validate, authController.adminLogin);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.put('/change-password', authenticateToken, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
