const cartService = require('../services/cart.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CartController {
  async getCart(req, res) {
    try {
      const cart = await cartService.getCart(req.user.user_id);
      
      return successResponse(res, {
        message: 'Cart retrieved successfully',
        data: cart
      });
    } catch (error) {
      logger.error('Get cart error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async addToCart(req, res) {
    try {
      const { variant_id, quantity } = req.body;
      const cart = await cartService.addToCart(
        req.user.user_id,
        variant_id,
        quantity
      );
      
      return successResponse(res, {
        message: 'Product added to cart successfully',
        data: cart
      });
    } catch (error) {
      logger.error('Add to cart error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async updateCartItem(req, res) {
    try {
      const { cartItemId } = req.params;
      const { quantity } = req.body;
      
      const cart = await cartService.updateCartItem(
        req.user.user_id,
        cartItemId,
        quantity
      );
      
      return successResponse(res, {
        message: 'Cart item updated successfully',
        data: cart
      });
    } catch (error) {
      logger.error('Update cart item error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async removeFromCart(req, res) {
    try {
      const { cartItemId } = req.params;
      
      const cart = await cartService.removeFromCart(
        req.user.user_id,
        cartItemId
      );
      
      return successResponse(res, {
        message: 'Item removed from cart successfully',
        data: cart
      });
    } catch (error) {
      logger.error('Remove from cart error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async clearCart(req, res) {
    try {
      await cartService.clearCart(req.user.user_id);
      
      return successResponse(res, {
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      logger.error('Clear cart error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async validateCart(req, res) {
    try {
      const validation = await cartService.validateCart(req.user.user_id);
      
      return successResponse(res, {
        message: 'Cart validation completed',
        data: validation
      });
    } catch (error) {
      logger.error('Validate cart error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new CartController();