const { body } = require('express-validator');
const { isValidPhoneNumber } = require('../utils/helpers');
const { PAYMENT_METHOD } = require('../utils/constants');

const orderValidator = {
  createOrder: [
    body('shipping_name')
      .trim()
      .notEmpty()
      .withMessage('Shipping name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping name must be between 2 and 100 characters'),

    body('shipping_phone')
      .trim()
      .notEmpty()
      .withMessage('Shipping phone is required')
      .custom(value => {
        if (!isValidPhoneNumber(value)) {
          throw new Error('Invalid phone number format');
        }
        return true;
      }),

    body('shipping_address')
      .trim()
      .notEmpty()
      .withMessage('Shipping address is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Shipping address must be between 10 and 500 characters'),

    body('payment_method')
      .optional()
      .isIn(Object.values(PAYMENT_METHOD))
      .withMessage('Invalid payment method'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),

    body('promotion_code')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Promotion code must not exceed 50 characters')
  ],

  cancelOrder: [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Cancel reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Cancel reason must be between 10 and 500 characters')
  ],

  updateStatus: [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid order status'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters')
  ]
};

module.exports = orderValidator;
