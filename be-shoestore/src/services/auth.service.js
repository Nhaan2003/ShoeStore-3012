const jwt = require('jsonwebtoken');
const { User } = require('../models');
const emailService = require('./email.service');
const { generateToken } = require('../utils/helpers');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { Op } = require('sequelize');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        throw {
          message: 'Email already registered',
          statusCode: 409
        };
      }
      
      // Create new user
      const user = await User.create({
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        phone: userData.phone,
        role: 'customer'
      });
      
      // Generate tokens
      const tokens = this.generateTokens(user);
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.full_name);
      
      return {
        user: user.toJSON(),
        ...tokens
      };
    } catch (error) {
      logger.error('Register service error:', error);
      throw error;
    }
  }
  
  async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({
        where: { email }
      });
      
      if (!user) {
        throw {
          message: 'Invalid email or password',
          statusCode: 401
        };
      }
      
      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw {
          message: 'Invalid email or password',
          statusCode: 401
        };
      }
      
      // Check if account is active
      if (user.status !== 'active') {
        throw {
          message: 'Account is not active',
          statusCode: 403
        };
      }
      
      // Update last login
      await user.update({ last_login: new Date() });
      
      // Generate tokens
      const tokens = this.generateTokens(user);
      
      // Cache user session in Redis
      await this.cacheUserSession(user.user_id, tokens.accessToken);
      
      return {
        user: user.toJSON(),
        ...tokens
      };
    } catch (error) {
      logger.error('Login service error:', error);
      throw error;
    }
  }
  
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user
      const user = await User.findByPk(decoded.user_id);
      if (!user || user.status !== 'active') {
        throw {
          message: 'Invalid refresh token',
          statusCode: 401
        };
      }
      
      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      // Update session in Redis
      await this.cacheUserSession(user.user_id, tokens.accessToken);
      
      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw {
        message: 'Invalid refresh token',
        statusCode: 401
      };
    }
  }
  
  async logout(userId) {
    try {
      // Remove user session from Redis
      await redisClient.del(`user_session:${userId}`);
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
  
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Don't reveal if email exists
        return true;
      }
      
      // Generate reset token
      const resetToken = generateToken();
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
      
      await user.update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires
      });
      
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);
      
      return true;
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }
  
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          reset_token: token,
          reset_token_expires: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (!user) {
        throw {
          message: 'Invalid or expired reset token',
          statusCode: 400
        };
      }
      
      // Update password
      await user.update({
        password: newPassword,
        reset_token: null,
        reset_token_expires: null
      });
      
      // Send confirmation email
      await emailService.sendPasswordChangedEmail(user.email);
      
      return true;
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }
  
  generateTokens(user) {
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async cacheUserSession(userId, token) {
    try {
      const key = `user_session:${userId}`;
      const ttl = 24 * 60 * 60; // 24 hours
      await redisClient.setex(key, ttl, token);
    } catch (error) {
      logger.error('Cache user session error:', error);
    }
  }
}

module.exports = new AuthService();