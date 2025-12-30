const { Op } = require('sequelize');
const { 
  Product, 
  ProductVariant, 
  ProductImage, 
  Category, 
  Brand,
  Review,
  sequelize 
} = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/helpers');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { CACHE_TTL } = require('../utils/constants');

class ProductService {
  async getProducts(query) {
    try {
      const {
        search,
        category_id,
        brand_id,
        min_price,
        max_price,
        size,
        color,
        gender,
        sort_by = 'created_at',
        sort_order = 'DESC',
        page,
        limit
      } = query;
      
      const { limit: pageLimit, offset } = getPagination(page, limit);
      
      // Build where clause
      const whereClause = {
        status: 'active'
      };
      
      if (search) {
        whereClause[Op.or] = [
          { product_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (category_id) whereClause.category_id = category_id;
      if (brand_id) whereClause.brand_id = brand_id;
      if (gender) whereClause.gender = gender;
      
      // Build variant where clause
      const variantWhere = {
        status: 'active'
      };
      
      if (size) variantWhere.size = size;
      if (color) variantWhere.color = color;
      
      if (min_price || max_price) {
        variantWhere.price = {};
        if (min_price) variantWhere.price[Op.gte] = min_price;
        if (max_price) variantWhere.price[Op.lte] = max_price;
      }
      
      // Execute query
      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['category_id', 'category_name']
          },
          {
            model: Brand,
            as: 'brand',
            attributes: ['brand_id', 'brand_name']
          },
          {
            model: ProductVariant,
            as: 'variants',
            where: variantWhere,
            required: true,
            attributes: ['variant_id', 'size', 'color', 'price', 'stock_quantity']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            attributes: ['image_url']
          },
          {
            model: Review,
            as: 'reviews',
            attributes: [],
            required: false
          }
        ],
        attributes: {
          include: [
            [sequelize.fn('AVG', sequelize.col('reviews.rating')), 'avg_rating'],
            [sequelize.fn('COUNT', sequelize.col('reviews.review_id')), 'review_count'],
            [sequelize.fn('MIN', sequelize.col('variants.price')), 'min_price'],
            [sequelize.fn('MAX', sequelize.col('variants.price')), 'max_price']
          ]
        },
        group: ['Product.product_id', 'category.category_id', 'brand.brand_id', 
               'variants.variant_id', 'images.image_id'],
        order: [[sort_by, sort_order]],
        limit: pageLimit,
        offset,
        distinct: true,
        subQuery: false
      });
      
      const meta = getPaginationMeta(count.length, page, limit);
      
      return {
        products,
        meta
      };
    } catch (error) {
      logger.error('Get products error:', error);
      throw error;
    }
  }
  
  async getProductById(productId) {
    try {
      // Try to get from cache first
      const cacheKey = `product:${productId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const product = await Product.findByPk(productId, {
        include: [
          {
            model: Category,
            as: 'category'
          },
          {
            model: Brand,
            as: 'brand'
          },
          {
            model: ProductVariant,
            as: 'variants',
            where: { status: 'active' },
            required: false
          },
          {
            model: ProductImage,
            as: 'images',
            order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
          },
          {
            model: Review,
            as: 'reviews',
            include: {
              model: User,
              as: 'user',
              attributes: ['user_id', 'full_name', 'avatar']
            },
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ]
      });
      
      if (!product) {
        throw {
          message: 'Product not found',
          statusCode: 404
        };
      }
      
      // Increment view count
      await product.increment('view_count');
      
      // Calculate statistics
      const stats = await this.getProductStats(productId);
      
      const result = {
        ...product.toJSON(),
        stats
      };
      
      // Cache the result
      await redisClient.setex(cacheKey, CACHE_TTL.PRODUCTS, JSON.stringify(result));
      
      return result;
    } catch (error) {
      logger.error('Get product by ID error:', error);
      throw error;
    }
  }
  
  async createProduct(productData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create product
      const product = await Product.create({
        ...productData,
        created_by: userId
      }, { transaction });
      
      // Create variants if provided
      if (productData.variants && productData.variants.length > 0) {
        const variants = productData.variants.map(v => ({
          ...v,
          product_id: product.product_id
        }));
        
        await ProductVariant.bulkCreate(variants, { transaction });
      }
      
      // Create images if provided
      if (productData.images && productData.images.length > 0) {
        const images = productData.images.map((img, index) => ({
          product_id: product.product_id,
          image_url: img.url,
          is_primary: index === 0,
          sort_order: index
        }));
        
        await ProductImage.bulkCreate(images, { transaction });
      }
      
      await transaction.commit();
      
      // Clear cache
      await this.clearProductCache();
      
      return await this.getProductById(product.product_id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create product error:', error);
      throw error;
    }
  }
  
  async updateProduct(productId, updateData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(productId);
      
      if (!product) {
        throw {
          message: 'Product not found',
          statusCode: 404
        };
      }
      
      // Update product
      await product.update(updateData, { transaction });
      
      // Update variants if provided
      if (updateData.variants) {
        // Implementation for updating variants
        // This would involve comparing existing variants with new ones
        // Adding new ones, updating existing ones, and removing deleted ones
      }
      
      await transaction.commit();
      
      // Clear cache
      await this.clearProductCache(productId);
      
      return await this.getProductById(productId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Update product error:', error);
      throw error;
    }
  }
  
  async deleteProduct(productId) {
    try {
      const product = await Product.findByPk(productId);
      
      if (!product) {
        throw {
          message: 'Product not found',
          statusCode: 404
        };
      }
      
      // Soft delete
      await product.update({ status: 'inactive' });
      
      // Clear cache
      await this.clearProductCache(productId);
      
      return true;
    } catch (error) {
      logger.error('Delete product error:', error);
      throw error;
    }
  }
  
  async getProductStats(productId) {
    try {
      const stats = await Review.findOne({
        where: { product_id: productId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('review_id')), 'totalReviews'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'uniqueReviewers']
        ]
      });
      
      const ratingDistribution = await Review.findAll({
        where: { product_id: productId },
        attributes: [
          'rating',
          [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
        ],
        group: ['rating']
      });
      
      return {
        avgRating: parseFloat(stats?.dataValues?.avgRating || 0).toFixed(1),
        totalReviews: parseInt(stats?.dataValues?.totalReviews || 0),
        ratingDistribution: ratingDistribution.reduce((acc, curr) => {
          acc[curr.rating] = parseInt(curr.dataValues.count);
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Get product stats error:', error);
      return {
        avgRating: 0,
        totalReviews: 0,
        ratingDistribution: {}
      };
    }
  }
  
  async clearProductCache(productId = null) {
    try {
      if (productId) {
        await redisClient.del(`product:${productId}`);
      } else {
        // Clear all product cache
        const keys = await redisClient.keys('product:*');
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Clear product cache error:', error);
    }
  }
  
  async searchProducts(searchTerm) {
    try {
      const products = await Product.findAll({
        where: {
          [Op.or]: [
            { product_name: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } },
            { '$brand.brand_name$': { [Op.like]: `%${searchTerm}%` } },
            { '$category.category_name$': { [Op.like]: `%${searchTerm}%` } }
          ],
          status: 'active'
        },
        include: [
          {
            model: Brand,
            as: 'brand',
            attributes: ['brand_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['category_name']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            attributes: ['image_url']
          }
        ],
        limit: 10
      });
      
      return products;
    } catch (error) {
      logger.error('Search products error:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();