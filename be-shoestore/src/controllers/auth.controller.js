const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      
      return successResponse(res, {
        message: 'Registration successful',
        data: result
      }, 201);
    } catch (error) {
      logger.error('Registration error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      return successResponse(res, {
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      return successResponse(res, {
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.user_id);
      
      return successResponse(res, {
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      
      return successResponse(res, {
        message: 'Password reset email sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      
      return successResponse(res, {
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new AuthController();