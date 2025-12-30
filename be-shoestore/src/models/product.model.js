const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material: {
    type: DataTypes.STRING(100)
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'unisex'),
    defaultValue: 'unisex'
  },
  product_type: {
    type: DataTypes.STRING(50)
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'Products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Virtual fields
Product.prototype.getMinPrice = async function() {
  const variants = await this.getVariants({
    attributes: [[sequelize.fn('MIN', sequelize.col('price')), 'minPrice']],
    where: { status: 'active' }
  });
  return variants[0]?.dataValues?.minPrice || this.base_price;
};

Product.prototype.getTotalStock = async function() {
  const variants = await this.getVariants({
    attributes: [[sequelize.fn('SUM', sequelize.col('stock_quantity')), 'totalStock']],
    where: { status: 'active' }
  });
  return variants[0]?.dataValues?.totalStock || 0;
};

module.exports = Product;