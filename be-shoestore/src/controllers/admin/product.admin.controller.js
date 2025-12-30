const productService = require('../../services/product.service');
const { successResponse, errorResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const upload = require('../../config/multer');
const uploadService = require('../../services/upload.service');

class ProductAdminController {
  async createProduct(req, res) {
    try {
      const productData = req.body;
      const product = await productService.createProduct(productData, req.user.user_id);
      
      return successResponse(res, {
        message: 'Product created successfully',
        data: product
      }, 201);
    } catch (error) {
      logger.error('Create product error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const updateData = req.body;
      
      const product = await productService.updateProduct(
        productId, 
        updateData, 
        req.user.user_id
      );
      
      return successResponse(res, {
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      logger.error('Update product error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      await productService.deleteProduct(productId);
      
      return successResponse(res, {
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async uploadProductImages(req, res) {
    try {
      const { productId } = req.params;
      
      if (!req.files || req.files.length === 0) {
        return errorResponse(res, 'No files uploaded', 400);
      }

      const uploadedImages = await uploadService.uploadProductImages(
        productId,
        req.files
      );

      return successResponse(res, {
        message: 'Images uploaded successfully',
        data: uploadedImages
      });
    } catch (error) {
      logger.error('Upload product images error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async updateVariantStock(req, res) {
    try {
      const { variantId } = req.params;
      const { stock_quantity, adjustment_type, reason } = req.body;

      const result = await productService.updateVariantStock(
        variantId,
        stock_quantity,
        adjustment_type,
        reason,
        req.user.user_id
      );

      return successResponse(res, {
        message: 'Stock updated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Update variant stock error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async bulkUpdateProducts(req, res) {
    try {
      const { products } = req.body;
      
      const results = await productService.bulkUpdateProducts(
        products,
        req.user.user_id
      );

      return successResponse(res, {
        message: 'Products updated successfully',
        data: results
      });
    } catch (error) {
      logger.error('Bulk update products error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async exportProducts(req, res) {
    try {
      const query = req.query;
      const fileBuffer = await productService.exportProductsToExcel(query);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=products.xlsx'
      );

      res.send(fileBuffer);
    } catch (error) {
      logger.error('Export products error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new ProductAdminController();