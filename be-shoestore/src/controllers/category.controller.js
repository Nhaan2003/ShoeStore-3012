const { Category, Product, ProductImage, ProductVariant, Brand } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CategoryController {
  async getCategories(req, res) {
    try {
      const { include_children, status = 'active' } = req.query;

      const whereClause = {};
      if (status) whereClause.status = status;

      let include = [];
      if (include_children === 'true') {
        include.push({
          model: Category,
          as: 'children',
          where: { status: 'active' },
          required: false
        });
      }

      const categories = await Category.findAll({
        where: {
          ...whereClause,
          parent_id: null
        },
        include,
        order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
      });

      return successResponse(res, {
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getCategoryTree(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: 'active', parent_id: null },
        include: [{
          model: Category,
          as: 'children',
          where: { status: 'active' },
          required: false,
          include: [{
            model: Category,
            as: 'children',
            where: { status: 'active' },
            required: false
          }]
        }],
        order: [
          ['sort_order', 'ASC'],
          ['category_name', 'ASC'],
          [{ model: Category, as: 'children' }, 'sort_order', 'ASC']
        ]
      });

      return successResponse(res, {
        message: 'Category tree retrieved successfully',
        data: categories
      });
    } catch (error) {
      logger.error('Get category tree error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getCategoryById(req, res) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findByPk(categoryId, {
        include: [
          {
            model: Category,
            as: 'parent'
          },
          {
            model: Category,
            as: 'children',
            where: { status: 'active' },
            required: false
          }
        ]
      });

      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }

      return successResponse(res, {
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      logger.error('Get category by ID error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 12, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get category and its children
      const category = await Category.findByPk(categoryId, {
        include: [{
          model: Category,
          as: 'children',
          attributes: ['category_id']
        }]
      });

      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }

      // Get all category IDs (parent + children)
      const categoryIds = [
        category.category_id,
        ...(category.children || []).map(c => c.category_id)
      ];

      const { count, rows: products } = await Product.findAndCountAll({
        where: {
          category_id: { [Op.in]: categoryIds },
          status: 'active'
        },
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
            where: { status: 'active' },
            required: false,
            attributes: ['variant_id', 'size', 'color', 'price', 'stock_quantity']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            attributes: ['image_url']
          }
        ],
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return successResponse(res, {
        message: 'Products retrieved successfully',
        data: products,
        meta: {
          category: {
            category_id: category.category_id,
            category_name: category.category_name
          },
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get products by category error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new CategoryController();
