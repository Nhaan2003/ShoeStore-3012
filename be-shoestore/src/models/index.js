const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Initialize all models
const models = {
  User: require('./user.model'),
  Product: require('./product.model'),
  Category: require('./category.model'),
  Brand: require('./brand.model'),
  ProductVariant: require('./productVariant.model'),
  ProductImage: require('./productImage.model'),
  Cart: require('./cart.model'),
  CartItem: require('./cartItem.model'),
  Order: require('./order.model'),
  OrderItem: require('./orderItem.model'),
  Review: require('./review.model'),
  ChatSession: require('./chatSession.model'),
  ChatMessage: require('./chatMessage.model')
};

// Define associations after all models are loaded
// User associations
models.User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
models.User.hasOne(models.Cart, { foreignKey: 'user_id', as: 'cart' });
models.User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews' });
models.User.hasMany(models.ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });

// Product associations
models.Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
models.Product.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
models.Product.hasMany(models.ProductVariant, { foreignKey: 'product_id', as: 'variants' });
models.Product.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
models.Product.hasMany(models.Review, { foreignKey: 'product_id', as: 'reviews' });

// Category associations
models.Category.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
models.Category.belongsTo(models.Category, { foreignKey: 'parent_id', as: 'parent' });
models.Category.hasMany(models.Category, { foreignKey: 'parent_id', as: 'children' });

// Brand associations
models.Brand.hasMany(models.Product, { foreignKey: 'brand_id', as: 'products' });

// ProductVariant associations
models.ProductVariant.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
models.ProductVariant.hasMany(models.CartItem, { foreignKey: 'variant_id', as: 'cartItems' });
models.ProductVariant.hasMany(models.OrderItem, { foreignKey: 'variant_id', as: 'orderItems' });

// ProductImage associations
models.ProductImage.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });

// Cart associations
models.Cart.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
models.Cart.hasMany(models.CartItem, { foreignKey: 'cart_id', as: 'items' });

// CartItem associations
models.CartItem.belongsTo(models.Cart, { foreignKey: 'cart_id', as: 'cart' });
models.CartItem.belongsTo(models.ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// Order associations
models.Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
models.Order.belongsTo(models.User, { foreignKey: 'processed_by', as: 'processor' });
models.Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });

// OrderItem associations
models.OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
models.OrderItem.belongsTo(models.ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// Review associations
models.Review.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
models.Review.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
models.Review.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });

// ChatSession associations
models.ChatSession.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
models.ChatSession.hasMany(models.ChatMessage, { foreignKey: 'session_id', as: 'messages' });

// ChatMessage associations
models.ChatMessage.belongsTo(models.ChatSession, { foreignKey: 'session_id', as: 'session' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  ...models
};

// module.exports = {
//   sequelize,
//   User,
//   Product,
//   Category,
//   Brand,
//   ProductVariant,
//   ProductImage,
//   Cart,
//   CartItem,
//   Order,
//   OrderItem,
//   Review,
//   ChatSession,
//   ChatMessage
// };