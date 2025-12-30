const { User, Order, Review, Product } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.user_id, {
        attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(res, {
        message: 'Profile retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async updateProfile(req, res) {
    try {
      const { full_name, phone, address, date_of_birth, gender, avatar } = req.body;

      const user = await User.findByPk(req.user.user_id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      await user.update({
        full_name: full_name || user.full_name,
        phone: phone || user.phone,
        address: address || user.address,
        date_of_birth: date_of_birth || user.date_of_birth,
        gender: gender || user.gender,
        avatar: avatar || user.avatar
      });

      return successResponse(res, {
        message: 'Profile updated successfully',
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      const user = await User.findByPk(req.user.user_id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(current_password);
      if (!isValidPassword) {
        return errorResponse(res, 'Current password is incorrect', 400);
      }

      // Update password
      await user.update({ password: new_password });

      return successResponse(res, {
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getOrderHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: orders } = await Order.findAndCountAll({
        where: { user_id: req.user.user_id },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      return successResponse(res, {
        message: 'Order history retrieved successfully',
        data: orders,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get order history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getMyReviews(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { user_id: req.user.user_id },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['product_id', 'product_name']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      return successResponse(res, {
        message: 'Reviews retrieved successfully',
        data: reviews,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get my reviews error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const user = await User.findByPk(req.user.user_id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.update({ avatar: avatarUrl });

      return successResponse(res, {
        message: 'Avatar uploaded successfully',
        data: { avatar: avatarUrl }
      });
    } catch (error) {
      logger.error('Upload avatar error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new UserController();
