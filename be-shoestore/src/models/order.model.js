const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require('../utils/constants');

const Order = sequelize.define('Order', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  order_code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  final_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    defaultValue: ORDER_STATUS.PENDING
  },
  payment_method: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD)),
    defaultValue: PAYMENT_METHOD.COD
  },
  payment_status: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
    defaultValue: PAYMENT_STATUS.UNPAID
  },
  shipping_address: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  shipping_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  shipping_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  notes: {
    type: DataTypes.STRING(500)
  },
  confirmed_at: {
    type: DataTypes.DATE
  },
  shipped_at: {
    type: DataTypes.DATE
  },
  delivered_at: {
    type: DataTypes.DATE
  },
  cancelled_at: {
    type: DataTypes.DATE
  },
  cancel_reason: {
    type: DataTypes.STRING(500)
  },
  processed_by: {
    type: DataTypes.INTEGER
  },
  promotion_code: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'Orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;