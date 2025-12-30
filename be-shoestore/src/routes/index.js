const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Public routes
try {
  const authRoutes = require('./auth.routes');
  router.use('/auth', authRoutes);
} catch (error) {
  console.error('Error loading auth routes:', error.message);
}

try {
  const productRoutes = require('./product.routes');
  router.use('/products', productRoutes);
} catch (error) {
  console.error('Error loading product routes:', error.message);
}

try {
  const categoryRoutes = require('./category.routes');
  router.use('/categories', categoryRoutes);
} catch (error) {
  console.error('Error loading category routes:', error.message);
}

try {
  const brandRoutes = require('./brand.routes');
  router.use('/brands', brandRoutes);
} catch (error) {
  console.error('Error loading brand routes:', error.message);
}

// Protected routes (authentication required - handled inside each route)
try {
  const userRoutes = require('./user.routes');
  router.use('/users', userRoutes);
} catch (error) {
  console.error('Error loading user routes:', error.message);
}

try {
  const cartRoutes = require('./cart.routes');
  router.use('/cart', cartRoutes);
} catch (error) {
  console.error('Error loading cart routes:', error.message);
}

try {
  const orderRoutes = require('./order.routes');
  router.use('/orders', orderRoutes);
} catch (error) {
  console.error('Error loading order routes:', error.message);
}

try {
  const reviewRoutes = require('./review.routes');
  router.use('/reviews', reviewRoutes);
} catch (error) {
  console.error('Error loading review routes:', error.message);
}

// Admin routes
try {
  const adminRoutes = require('./admin');
  router.use('/admin', adminRoutes);
} catch (error) {
  console.error('Error loading admin routes:', error.message);
}

// Staff routes
try {
  const staffRoutes = require('./staff');
  router.use('/staff', staffRoutes);
} catch (error) {
  console.error('Error loading staff routes:', error.message);
}

module.exports = router;
