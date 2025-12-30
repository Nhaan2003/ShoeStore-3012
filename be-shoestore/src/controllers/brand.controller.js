const { Brand, Product, ProductImage, ProductVariant, Category } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class BrandController {
  async getBrands(req, res) {
    try {
      const { status = 'active' } = req.query;

      const whereClause = {};
      if (status) whereClause.status = status;

      const brands = await Brand.findAll({
        where: whereClause,
        order: [['brand_name', 'ASC']]
      });

      return successResponse(res, {
        message: 'Brands retrieved successfully',
        data: brands
      });
    } catch (error) {
      logger.error('Get brands error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getBrandById(req, res) {
    try {
      const { brandId } = req.params;

      const brand = await Brand.findByPk(brandId);

      if (!brand) {
        return errorResponse(res, 'Brand not found', 404);
      }

      return successResponse(res, {
        message: 'Brand retrieved successfully',
        data: brand
      });
    } catch (error) {
      logger.error('Get brand by ID error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getProductsByBrand(req, res) {
    try {
      const { brandId } = req.params;
      const { page = 1, limit = 12, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const brand = await Brand.findByPk(brandId);

      if (!brand) {
        return errorResponse(res, 'Brand not found', 404);
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: {
          brand_id: brandId,
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
          brand: {
            brand_id: brand.brand_id,
            brand_name: brand.brand_name
          },
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get products by brand error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new BrandController();
