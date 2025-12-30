const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  variant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  size: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'ProductVariants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'size', 'color']
    }
  ]
});

// Hooks
ProductVariant.beforeCreate(async (variant) => {
  if (!variant.sku) {
    const product = await variant.getProduct();
    variant.sku = `${product.product_id}-${variant.size}-${variant.color}`.toUpperCase();
  }
});

// Methods
ProductVariant.prototype.isInStock = function() {
  return this.stock_quantity > 0 && this.status === 'active';
};

ProductVariant.prototype.canFulfillQuantity = function(quantity) {
  return this.stock_quantity >= quantity;
};

module.exports = ProductVariant;