const { Cart, CartItem, ProductVariant, Product, ProductImage } = require('../models');
const logger = require('../utils/logger');
const { sequelize } = require('../models');

class CartService {
  async getCart(userId) {
    try {
      let cart = await Cart.findOne({
        where: { user_id: userId },
        include: [{
          model: CartItem,
          as: 'items',
          include: [{
            model: ProductVariant,
            as: 'variant',
            include: [{
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false
                }
              ]
            }]
          }]
        }]
      });

      if (!cart) {
        cart = await Cart.create({ user_id: userId });
        cart.items = [];
      }

      // Calculate totals
      const cartData = cart.toJSON();
      cartData.subtotal = 0;
      cartData.totalItems = 0;

      cartData.items = cartData.items.map(item => {
        const itemTotal = item.quantity * item.variant.price;
        cartData.subtotal += itemTotal;
        cartData.totalItems += item.quantity;

        return {
          ...item,
          itemTotal,
          inStock: item.variant.stock_quantity >= item.quantity
        };
      });

      return cartData;
    } catch (error) {
      logger.error('Get cart error:', error);
      throw error;
    }
  }

  async addToCart(userId, variantId, quantity = 1) {
    const transaction = await sequelize.transaction();

    try {
      // Get or create cart
      let cart = await Cart.findOne({ where: { user_id: userId } });
      if (!cart) {
        cart = await Cart.create({ user_id: userId }, { transaction });
      }

      // Check variant availability
      const variant = await ProductVariant.findByPk(variantId, {
        include: [{
          model: Product,
          as: 'product'
        }]
      });

      if (!variant || variant.status !== 'active') {
        throw {
          message: 'Product variant not found or inactive',
          statusCode: 404
        };
      }

      if (variant.stock_quantity < quantity) {
        throw {
          message: 'Insufficient stock',
          statusCode: 400
        };
      }

      // Check if item already in cart
      let cartItem = await CartItem.findOne({
        where: {
          cart_id: cart.cart_id,
          variant_id: variantId
        }
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;
        
        if (variant.stock_quantity < newQuantity) {
          throw {
            message: 'Insufficient stock for the requested quantity',
            statusCode: 400
          };
        }

        await cartItem.update({ quantity: newQuantity }, { transaction });
      } else {
        // Add new item
        cartItem = await CartItem.create({
          cart_id: cart.cart_id,
          variant_id: variantId,
          quantity
        }, { transaction });
      }

      await transaction.commit();

      return await this.getCart(userId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Add to cart error:', error);
      throw error;
    }
  }

  async updateCartItem(userId, cartItemId, quantity) {
    const transaction = await sequelize.transaction();

    try {
      const cart = await Cart.findOne({ where: { user_id: userId } });
      if (!cart) {
        throw {
          message: 'Cart not found',
          statusCode: 404
        };
      }

      const cartItem = await CartItem.findOne({
        where: {
          cart_item_id: cartItemId,
          cart_id: cart.cart_id
        },
        include: [{
          model: ProductVariant,
          as: 'variant'
        }]
      });

      if (!cartItem) {
        throw {
          message: 'Cart item not found',
          statusCode: 404
        };
      }

      if (quantity === 0) {
        // Remove item
        await cartItem.destroy({ transaction });
      } else {
        // Check stock
        if (cartItem.variant.stock_quantity < quantity) {
          throw {
            message: 'Insufficient stock',
            statusCode: 400
          };
        }

        await cartItem.update({ quantity }, { transaction });
      }

      await transaction.commit();

      return await this.getCart(userId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Update cart item error:', error);
      throw error;
    }
  }

  async removeFromCart(userId, cartItemId) {
    try {
      const cart = await Cart.findOne({ where: { user_id: userId } });
      if (!cart) {
        throw {
          message: 'Cart not found',
          statusCode: 404
        };
      }

      const deleted = await CartItem.destroy({
        where: {
          cart_item_id: cartItemId,
          cart_id: cart.cart_id
        }
      });

      if (!deleted) {
        throw {
          message: 'Cart item not found',
          statusCode: 404
        };
      }

      return await this.getCart(userId);
    } catch (error) {
      logger.error('Remove from cart error:', error);
      throw error;
    }
  }

  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ where: { user_id: userId } });
      if (!cart) {
        return true;
      }

      await CartItem.destroy({
        where: { cart_id: cart.cart_id }
      });

      return true;
    } catch (error) {
      logger.error('Clear cart error:', error);
      throw error;
    }
  }

  async validateCart(userId) {
    try {
      const cart = await this.getCart(userId);
      const issues = [];

      for (const item of cart.items) {
        const variant = await ProductVariant.findByPk(item.variant_id);
        
        if (!variant || variant.status !== 'active') {
          issues.push({
            cart_item_id: item.cart_item_id,
            issue: 'Product no longer available'
          });
        } else if (variant.stock_quantity < item.quantity) {
          issues.push({
            cart_item_id: item.cart_item_id,
            issue: 'Insufficient stock',
            available_quantity: variant.stock_quantity
          });
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      logger.error('Validate cart error:', error);
      throw error;
    }
  }
}

module.exports = new CartService();