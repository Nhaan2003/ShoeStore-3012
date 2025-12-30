const orderService = require('../../services/order.service');
const { successResponse, errorResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

class OrderStaffController {
  async getOrders(req, res) {
    try {
      const result = await orderService.getAllOrders(req.query);
      
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
      const order = await orderService.getOrderById(orderId);
      
      return successResponse(res, {
        message: 'Order retrieved successfully',
        data: order
      });
    } catch (error) {
      logger.error('Get order by ID error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;
      
      const order = await orderService.updateOrderStatus(
        orderId,
        status,
        req.user.user_id,
        notes
      );
      
      return successResponse(res, {
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      logger.error('Update order status error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async addOrderNote(req, res) {
    try {
      const { orderId } = req.params;
      const { note } = req.body;

      const result = await orderService.addOrderNote(
        orderId,
        note,
        req.user.user_id
      );

      return successResponse(res, {
        message: 'Note added successfully',
        data: result
      });
    } catch (error) {
      logger.error('Add order note error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await orderService.updateOrderStatus(
        orderId,
        'cancelled',
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

  async getStats(req, res) {
    try {
      const { Order } = require('../../models');
      const { Op } = require('sequelize');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        pending: await Order.count({ where: { status: 'pending' } }),
        confirmed: await Order.count({ where: { status: 'confirmed' } }),
        processing: await Order.count({ where: { status: 'processing' } }),
        shipped: await Order.count({ where: { status: 'shipped' } }),
        delivered: await Order.count({ where: { status: 'delivered' } }),
        cancelled: await Order.count({ where: { status: 'cancelled' } }),
        todayOrders: await Order.count({
          where: {
            created_at: { [Op.gte]: today }
          }
        }),
        processedByMe: await Order.count({
          where: { processed_by: req.user.user_id }
        })
      };

      return successResponse(res, {
        message: 'Statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new OrderStaffController();