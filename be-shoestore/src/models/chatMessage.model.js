const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { CHAT_INTENT } = require('../utils/constants');

const ChatMessage = sequelize.define('ChatMessage', {
  message_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_type: {
    type: DataTypes.ENUM('user', 'bot'),
    allowNull: false
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  intent: {
    type: DataTypes.ENUM(...Object.values(CHAT_INTENT))
  },
  entities: {
    type: DataTypes.JSON
  },
  products: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'ChatMessages',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

module.exports = ChatMessage;