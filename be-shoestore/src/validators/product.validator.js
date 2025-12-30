const { query, param, body } = require('express-validator');

const productValidator = {
  getProducts: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('min_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    
    query('max_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number')
      .custom((value, { req }) => {
        if (req.query.min_price && parseFloat(value) < parseFloat(req.query.min_price)) {
          throw new Error('Maximum price must be greater than minimum price');
        }
        return true;
      }),
    
    query('category_id')
      .optional()
      .isInt()
      .withMessage('Category ID must be an integer'),
    
    query('brand_id')
      .optional()
      .isInt()
      .withMessage('Brand ID must be an integer'),
    
    query('gender')
      .optional()
      .isIn(['male', 'female', 'unisex'])
      .withMessage('Gender must be male, female, or unisex'),
    
    query('sort_by')
      .optional()
      .isIn(['created_at', 'price', 'product_name', 'view_count'])
      .withMessage('Invalid sort field'),
    
    query('sort_order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC')
  ],
  
  getProductById: [
    param('productId')
      .isInt()
      .withMessage('Product ID must be an integer')
  ],
  
  searchProducts: [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters long')
  ],
  
  createProduct: [
    body('product_name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 200 })
      .withMessage('Product name must not exceed 200 characters'),
    
    body('base_price')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    
    body('category_id')
      .isInt()
      .withMessage('Category ID is required'),
    
    body('brand_id')
      .isInt()
      .withMessage('Brand ID is required'),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'unisex'])
      .withMessage('Gender must be male, female, or unisex'),
    
    body('variants')
      .optional()
      .isArray()
      .withMessage('Variants must be an array'),
    
    body('variants.*.size')
      .notEmpty()
      .withMessage('Variant size is required'),
    
    body('variants.*.color')
      .notEmpty()
      .withMessage('Variant color is required'),
    
    body('variants.*.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Variant price must be a positive number'),
    
    body('variants.*.stock_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer')
  ],

  updateProduct: [
    param('productId')
      .isInt()
      .withMessage('Product ID must be an integer'),
      
    body('product_name')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Product name must not exceed 200 characters'),
    
    body('base_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    
    body('category_id')
      .optional()
      .isInt()
      .withMessage('Category ID must be an integer'),
    
    body('brand_id')
      .optional()
      .isInt()
      .withMessage('Brand ID must be an integer'),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'unisex'])
      .withMessage('Gender must be male, female, or unisex'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive')
  ]
};

module.exports = productValidator;