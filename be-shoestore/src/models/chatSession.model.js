const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ChatSession = sequelize.define('ChatSession', {
  session_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  session_token: {
    type: DataTypes.STRING(255),
    unique: true,
    defaultValue: () => uuidv4()
  },
  status: {
    type: DataTypes.ENUM('active', 'ended'),
    defaultValue: 'active'
  },
  ended_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'ChatSessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ChatSession;