const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/role.middleware');

// Import admin routes
const dashboardRoutes = require('./dashboard.routes');
const productAdminRoutes = require('./product.admin.routes');
const orderAdminRoutes = require('./order.admin.routes');
const userAdminRoutes = require('./user.admin.routes');

// Apply authentication and admin role middleware to all admin routes
router.use(authMiddleware, isAdmin);

// Mount admin routes
router.use('/dashboard', dashboardRoutes);
router.use('/products', productAdminRoutes);
router.use('/orders', orderAdminRoutes);
router.use('/users', userAdminRoutes);

module.exports = router;