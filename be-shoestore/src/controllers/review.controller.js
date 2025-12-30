const { Review, User, Product, Order, OrderItem, ProductVariant } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class ReviewController {
  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, rating } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {
        product_id: productId,
        status: 'approved'
      };

      if (rating) {
        whereClause.rating = rating;
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'avatar']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Calculate rating statistics
      const stats = await Review.findOne({
        where: { product_id: productId, status: 'approved' },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating'],
          [require('sequelize').fn('COUNT', require('sequelize').col('review_id')), 'totalReviews']
        ],
        raw: true
      });

      return successResponse(res, {
        message: 'Reviews retrieved successfully',
        data: reviews,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
          avgRating: parseFloat(stats?.avgRating || 0).toFixed(1),
          totalReviews: parseInt(stats?.totalReviews || 0)
        }
      });
    } catch (error) {
      logger.error('Get product reviews error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async createReview(req, res) {
    try {
      const { productId } = req.params;
      const { order_id, rating, title, comment, images } = req.body;
      const userId = req.user.user_id;

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      // Check if user has ordered this product
      const hasOrdered = await OrderItem.findOne({
        include: [{
          model: Order,
          as: 'order',
          where: {
            user_id: userId,
            status: 'delivered'
          }
        }, {
          model: ProductVariant,
          as: 'variant',
          where: { product_id: productId }
        }]
      });

      if (!hasOrdered) {
        return errorResponse(res, 'You can only review products you have purchased', 403);
      }

      // Check if user has already reviewed this product for this order
      const existingReview = await Review.findOne({
        where: {
          user_id: userId,
          product_id: productId,
          order_id: order_id || null
        }
      });

      if (existingReview) {
        return errorResponse(res, 'You have already reviewed this product', 409);
      }

      // Create review
      const review = await Review.create({
        user_id: userId,
        product_id: productId,
        order_id: order_id || null,
        rating,
        title,
        comment,
        images: images ? JSON.stringify(images) : null,
        status: 'pending'
      });

      return successResponse(res, {
        message: 'Review submitted successfully. It will be visible after approval.',
        data: review
      }, 201);
    } catch (error) {
      logger.error('Create review error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment, images } = req.body;
      const userId = req.user.user_id;

      const review = await Review.findOne({
        where: {
          review_id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return errorResponse(res, 'Review not found', 404);
      }

      // Only allow editing pending or approved reviews
      if (review.status === 'rejected') {
        return errorResponse(res, 'Cannot edit rejected reviews', 400);
      }

      await review.update({
        rating: rating || review.rating,
        title: title || review.title,
        comment: comment || review.comment,
        images: images ? JSON.stringify(images) : review.images,
        status: 'pending' // Reset to pending for re-approval
      });

      return successResponse(res, {
        message: 'Review updated successfully. It will be visible after approval.',
        data: review
      });
    } catch (error) {
      logger.error('Update review error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.user_id;

      const review = await Review.findOne({
        where: {
          review_id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return errorResponse(res, 'Review not found', 404);
      }

      await review.destroy();

      return successResponse(res, {
        message: 'Review deleted successfully'
      });
    } catch (error) {
      logger.error('Delete review error:', error);
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
        message: 'My reviews retrieved successfully',
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
}

module.exports = new ReviewController();
