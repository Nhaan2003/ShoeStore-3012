const productService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class ProductController {
  async getProducts(req, res) {
    try {
      const result = await productService.getProducts(req.query);
      
      return successResponse(res, {
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta
      });
    } catch (error) {
      logger.error('Get products error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
  
  async getProductById(req, res) {
    try {
      const { productId } = req.params;
      const product = await productService.getProductById(productId);
      
      return successResponse(res, {
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      logger.error('Get product by ID error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
  
  async searchProducts(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return successResponse(res, {
          message: 'Search results',
          data: []
        });
      }
      
      const products = await productService.searchProducts(q);
      
      return successResponse(res, {
        message: 'Search results',
        data: products
      });
    } catch (error) {
      logger.error('Search products error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
  
  async getRelatedProducts(req, res) {
    try {
      const { productId } = req.params;
      
      // Get current product to find related ones
      const currentProduct = await productService.getProductById(productId);
      
      // Find related products based on category and brand
      const relatedProducts = await productService.getProducts({
        category_id: currentProduct.category_id,
        brand_id: currentProduct.brand_id,
        limit: 8
      });
      
      // Filter out current product
      const filtered = relatedProducts.products.filter(
        p => p.product_id !== parseInt(productId)
      );
      
      return successResponse(res, {
        message: 'Related products retrieved successfully',
        data: filtered.slice(0, 6)
      });
    } catch (error) {
      logger.error('Get related products error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new ProductController();