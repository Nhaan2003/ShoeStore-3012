const { sequelize } = require('../src/models');

// Set test environment
process.env.NODE_ENV = 'test';

// Close database connection after all tests
afterAll(async () => {
  await sequelize.close();
});

// Global test utilities
global.testUser = {
  email: 'test@example.com',
  password: 'Test123!',
  full_name: 'Test User',
  phone: '0123456789'
};

global.testAdmin = {
  email: 'admin@example.com',
  password: 'Admin123!',
  full_name: 'Admin User',
  role: 'admin'
};