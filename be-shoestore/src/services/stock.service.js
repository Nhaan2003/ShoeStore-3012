const { ProductVariant, StockMovement, sequelize } = require('../models');
const logger = require('../utils/logger');

class StockService {
  async increaseStock(variantId, quantity, referenceType, referenceId, userId, transaction = null) {
    try {
      const options = transaction ? { transaction } : {};

      // Update variant stock
      await ProductVariant.increment(
        'stock_quantity',
        { 
          by: quantity,
          where: { variant_id: variantId },
          ...options
        }
      );

      // Record stock movement
      await StockMovement.create({
        variant_id: variantId,
        movement_type: 'in',
        quantity,
        reference_type: referenceType,
        reference_id: referenceId,
        created_by: userId
      }, options);

      return true;
    } catch (error) {
      logger.error('Increase stock error:', error);
      throw error;
    }
  }

  async decreaseStock(variantId, quantity, referenceType, referenceId, userId, transaction = null) {
    try {
      const options = transaction ? { transaction } : {};

      // Check current stock
      const variant = await ProductVariant.findByPk(variantId, options);
      if (!variant || variant.stock_quantity < quantity) {
        throw {
          message: 'Insufficient stock',
          statusCode: 400
        };
      }

      // Update variant stock
      await ProductVariant.decrement(
        'stock_quantity',
        { 
          by: quantity,
          where: { variant_id: variantId },
          ...options
        }
      );

      // Record stock movement
      await StockMovement.create({
        variant_id: variantId,
        movement_type: 'out',
        quantity,
        reference_type: referenceType,
        reference_id: referenceId,
        created_by: userId
      }, options);

      return true;
    } catch (error) {
      logger.error('Decrease stock error:', error);
      throw error;
    }
  }

  async adjustStock(variantId, newQuantity, reason, userId) {
    const transaction = await sequelize.transaction();

    try {
      const variant = await ProductVariant.findByPk(variantId);
      if (!variant) {
        throw {
          message: 'Product variant not found',
          statusCode: 404
        };
      }

      const currentQuantity = variant.stock_quantity;
      const difference = newQuantity - currentQuantity;

      // Update stock
      await variant.update({ stock_quantity: newQuantity }, { transaction });

      // Record movement
      await StockMovement.create({
        variant_id: variantId,
        movement_type: 'adjust',
        quantity: Math.abs(difference),
        reference_type: 'manual_adjust',
        notes: `${reason} (${currentQuantity} -> ${newQuantity})`,
        created_by: userId
      }, { transaction });

      await transaction.commit();

      return {
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        difference
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Adjust stock error:', error);
      throw error;
    }
  }

  async getStockHistory(variantId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        movement_type,
        start_date,
        end_date
      } = options;

      const where = { variant_id: variantId };
      
      if (movement_type) {
        where.movement_type = movement_type;
      }

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at[Op.gte] = new Date(start_date);
        if (end_date) where.created_at[Op.lte] = new Date(end_date);
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await StockMovement.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['user_id', 'full_name']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      return {
        movements: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get stock history error:', error);
      throw error;
    }
  }

  async getLowStockProducts(threshold = 10) {
    try {
      const lowStockVariants = await ProductVariant.findAll({
        where: {
          stock_quantity: { [Op.lt]: threshold },
          status: 'active'
        },
        include: [{
          model: Product,
          as: 'product',
          include: [
            { model: Brand, as: 'brand' },
            { model: Category, as: 'category' }
          ]
        }],
        order: [['stock_quantity', 'ASC']]
      });

      return lowStockVariants;
    } catch (error) {
      logger.error('Get low stock products error:', error);
      throw error;
    }
  }
}

module.exports = new StockService();