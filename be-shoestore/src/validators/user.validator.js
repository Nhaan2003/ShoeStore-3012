const { body } = require('express-validator');
const { isValidPhoneNumber } = require('../utils/helpers');

const userValidator = {
  updateProfile: [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
      .optional()
      .custom(value => {
        if (value && !isValidPhoneNumber(value)) {
          throw new Error('Invalid phone number format');
        }
        return true;
      }),

    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Address must not exceed 500 characters'),

    body('date_of_birth')
      .optional()
      .isDate()
      .withMessage('Invalid date format'),

    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other')
  ],

  changePassword: [
    body('current_password')
      .notEmpty()
      .withMessage('Current password is required'),

    body('new_password')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('confirm_password')
      .optional()
      .custom((value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
  ]
};

module.exports = userValidator;
