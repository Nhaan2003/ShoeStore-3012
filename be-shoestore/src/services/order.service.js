const { 
  Order, 
  OrderItem, 
  Cart, 
  CartItem, 
  ProductVariant,
  Product,
  User,
  sequelize 
} = require('../models');
const { generateOrderCode, normalizePhoneNumber } = require('../utils/helpers');
const { ORDER_STATUS } = require('../utils/constants');
const emailService = require('./email.service');
const stockService = require('./stock.service');
const logger = require('../utils/logger');

class OrderService {
  async createOrder(userId, orderData) {
    const transaction = await sequelize.transaction();

    try {
      // Validate cart
      const cart = await Cart.findOne({
        where: { user_id: userId },
        include: [{
          model: CartItem,
          as: 'items',
          include: [{
            model: ProductVariant,
            as: 'variant',
            include: [{
              model: Product,
              as: 'product'
            }]
          }]
        }]
      });

      if (!cart || cart.items.length === 0) {
        throw {
          message: 'Cart is empty',
          statusCode: 400
        };
      }

      // Calculate totals
      let totalAmount = 0;
      const orderItems = [];

      for (const item of cart.items) {
        // Check stock again
        if (item.variant.stock_quantity < item.quantity) {
          throw {
            message: `Insufficient stock for ${item.variant.product.product_name}`,
            statusCode: 400
          };
        }

        const itemTotal = item.quantity * item.variant.price;
        totalAmount += itemTotal;

        orderItems.push({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.variant.price,
          subtotal: itemTotal
        });
      }

      // Calculate final amount
      const shippingFee = orderData.shipping_fee || 0;
      const discountAmount = orderData.discount_amount || 0;
      const finalAmount = totalAmount + shippingFee - discountAmount;

      // Create order
      const order = await Order.create({
        user_id: userId,
        order_code: generateOrderCode(),
        total_amount: totalAmount,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        final_amount: finalAmount,
        payment_method: orderData.payment_method,
        shipping_address: orderData.shipping_address,
        shipping_phone: normalizePhoneNumber(orderData.shipping_phone),
        shipping_name: orderData.shipping_name,
        notes: orderData.notes,
        promotion_code: orderData.promotion_code
      }, { transaction });

      // Create order items
      const itemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.order_id
      }));

      await OrderItem.bulkCreate(itemsWithOrderId, { transaction });

      // Update stock
      for (const item of cart.items) {
        await stockService.decreaseStock(
          item.variant_id, 
          item.quantity, 
          'order', 
          order.order_id,
          userId,
          transaction
        );
      }

      // Clear cart
      await CartItem.destroy({
        where: { cart_id: cart.cart_id }
      }, { transaction });

      await transaction.commit();

      // Send order confirmation email
      const user = await User.findByPk(userId);
      await emailService.sendOrderConfirmationEmail(
        user.email,
        order.order_code,
        orderItems,
        finalAmount
      );

      // Get complete order data
      return await this.getOrderById(order.order_id, userId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create order error:', error);
      throw error;
    }
  }

  async getOrders(userId, query = {}) {
    try {
      const {
        status,
        payment_status,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = query;

      const where = { user_id: userId };
      if (status) where.status = status;
      if (payment_status) where.payment_status = payment_status;

      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: ProductVariant,
            as: 'variant',
            include: [{
              model: Product,
              as: 'product',
              include: [{
                model: ProductImage,
                as: 'images',
                where: { is_primary: true },
                required: false
              }]
            }]
          }]
        }],
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset
      });

      return {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get orders error:', error);
      throw error;
    }
  }

  async getOrderById(orderId, userId = null) {
    try {
      const where = { order_id: orderId };
      if (userId) where.user_id = userId;

      const order = await Order.findOne({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [{
              model: ProductVariant,
              as: 'variant',
              include: [{
                model: Product,
                as: 'product',
                include: [
                  {
                    model: Brand,
                    as: 'brand'
                  },
                  {
                    model: ProductImage,
                    as: 'images',
                    where: { is_primary: true },
                    required: false
                  }
                ]
              }]
            }]
          }
        ]
      });

      if (!order) {
        throw {
          message: 'Order not found',
          statusCode: 404
        };
      }

      return order;
    } catch (error) {
      logger.error('Get order by ID error:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, newStatus, userId, notes = null) {
    const transaction = await sequelize.transaction();

    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!order) {
        throw {
          message: 'Order not found',
          statusCode: 404
        };
      }

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw {
          message: `Cannot change status from ${order.status} to ${newStatus}`,
          statusCode: 400
        };
      }

      const updateData = {
        status: newStatus,
        processed_by: userId
      };

      // Set timestamps based on status
      switch (newStatus) {
        case ORDER_STATUS.CONFIRMED:
          updateData.confirmed_at = new Date();
          break;
        case ORDER_STATUS.SHIPPED:
          updateData.shipped_at = new Date();
          break;
        case ORDER_STATUS.DELIVERED:
          updateData.delivered_at = new Date();
          updateData.payment_status = 'paid';
          break;
        case ORDER_STATUS.CANCELLED:
          updateData.cancelled_at = new Date();
          updateData.cancel_reason = notes;
          break;
      }

      await order.update(updateData, { transaction });

      // If cancelled, restore stock
      if (newStatus === ORDER_STATUS.CANCELLED) {
        for (const item of order.items) {
          await stockService.increaseStock(
            item.variant_id,
            item.quantity,
            'order_cancel',
            order.order_id,
            userId,
            transaction
          );
        }
      }

      // Save status history
      await OrderStatusHistory.create({
        order_id: orderId,
        old_status: order.status,
        new_status: newStatus,
        notes,
        changed_by: userId
      }, { transaction });

      await transaction.commit();

      // Send status update email
      const user = await User.findByPk(order.user_id);
      await emailService.sendOrderStatusUpdateEmail(
        user.email,
        order.order_code,
        newStatus
      );

      return await this.getOrderById(orderId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Update order status error:', error);
      throw error;
    }
  }

  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await Order.findOne({
        where: {
          order_id: orderId,
          user_id: userId
        }
      });

      if (!order) {
        throw {
          message: 'Order not found',
          statusCode: 404
        };
      }

      if (!this.canBeCancelled(order.status)) {
        throw {
          message: 'Order cannot be cancelled at this stage',
          statusCode: 400
        };
      }

      return await this.updateOrderStatus(
        orderId, 
        ORDER_STATUS.CANCELLED, 
        userId, 
        reason
      );
    } catch (error) {
      logger.error('Cancel order error:', error);
      throw error;
    }
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const transitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: []
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  canBeCancelled(status) {
    return [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING
    ].includes(status);
  }
}

module.exports = new OrderService();