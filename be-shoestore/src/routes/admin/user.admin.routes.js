const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const validationMiddleware = require('../../middlewares/validation.middleware');

// Temporary controller functions
const userAdminController = {
  getAllUsers: (req, res) => {
    res.json({ success: true, message: 'Get all users' });
  },
  getUserById: (req, res) => {
    res.json({ success: true, message: 'Get user by ID' });
  },
  updateUserStatus: (req, res) => {
    res.json({ success: true, message: 'Update user status' });
  },
  createStaffAccount: (req, res) => {
    res.json({ success: true, message: 'Create staff account' });
  }
};

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['customer', 'staff', 'admin']),
    query('status').optional().isIn(['active', 'inactive', 'banned'])
  ],
  validationMiddleware,
  userAdminController.getAllUsers
);

router.get('/:userId',
  [param('userId').isInt()],
  validationMiddleware,
  userAdminController.getUserById
);

router.put('/:userId/status',
  [
    param('userId').isInt(),
    body('status').isIn(['active', 'inactive', 'banned']),
    body('reason').optional().isString()
  ],
  validationMiddleware,
  userAdminController.updateUserStatus
);

router.post('/staff',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty(),
    body('phone').isMobilePhone('vi-VN')
  ],
  validationMiddleware,
  userAdminController.createStaffAccount
);

module.exports = router;