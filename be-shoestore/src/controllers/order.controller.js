const orderService = require('../services/order.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res) {
    try {
      const orderData = req.body;
      const order = await orderService.createOrder(
        req.user.user_id,
        orderData
      );
      
      return successResponse(res, {
        message: 'Order created successfully',
        data: order
      }, 201);
    } catch (error) {
      logger.error('Create order error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async getOrders(req, res) {
    try {
      const result = await orderService.getOrders(
        req.user.user_id,
        req.query
      );
      
      return successResponse(res, {
        message: 'Orders retrieved successfully',
        data: result.orders,
        meta: result.pagination
      });
    } catch (error) {
      logger.error('Get orders error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderById(
        orderId,
        req.user.user_id
      );
      
      return successResponse(res, {
        message: 'Order retrieved successfully',
        data: order
      });
    } catch (error) {
      logger.error('Get order by ID error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      
      const order = await orderService.cancelOrder(
        orderId,
        req.user.user_id,
        reason
      );
      
      return successResponse(res, {
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      logger.error('Cancel order error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async trackOrder(req, res) {
    try {
      const { orderCode } = req.params;
      
      // Implementation for order tracking
      const trackingInfo = {
        order_code: orderCode,
        current_status: 'shipped',
        tracking_number: 'VN123456789',
        carrier: 'Giao Hàng Nhanh',
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tracking_history: [
          {
            status: 'Order placed',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            location: 'Ho Chi Minh City'
          },
          {
            status: 'Processing',
            timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
            location: 'Warehouse'
          },
          {
            status: 'Shipped',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            location: 'Distribution Center'
          }
        ]
      };
      
      return successResponse(res, {
        message: 'Order tracking info retrieved',
        data: trackingInfo
      });
    } catch (error) {
      logger.error('Track order error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new OrderController();