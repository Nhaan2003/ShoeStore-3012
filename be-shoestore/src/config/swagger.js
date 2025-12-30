const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shoe Store API',
      version: '1.0.0',
      description: 'API documentation for Shoe Store E-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@shoestore.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.shoestore.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            email: { type: 'string' },
            full_name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'staff', 'customer'] },
            status: { type: 'string', enum: ['active', 'inactive', 'blocked'] }
          }
        },
        Product: {
          type: 'object',
          properties: {
            product_id: { type: 'integer' },
            product_name: { type: 'string' },
            description: { type: 'string' },
            base_price: { type: 'number' },
            category_id: { type: 'integer' },
            brand_id: { type: 'integer' },
            gender: { type: 'string', enum: ['male', 'female', 'unisex'] },
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        },
        Order: {
          type: 'object',
          properties: {
            order_id: { type: 'integer' },
            order_code: { type: 'string' },
            total_amount: { type: 'number' },
            status: { type: 'string' },
            payment_method: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/**/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;