const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { ProductImage } = require('../models');
const logger = require('../utils/logger');

class UploadService {
  async uploadProductImages(productId, files) {
    try {
      const uploadedImages = [];
      
      for (const [index, file] of files.entries()) {
        // Generate different sizes
        const filename = path.parse(file.filename).name;
        const ext = path.parse(file.filename).ext;
        
        // Original
        const originalPath = file.path;
        
        // Thumbnail (300x300)
        const thumbnailPath = path.join('uploads/products', `${filename}-thumb${ext}`);
        await sharp(originalPath)
          .resize(300, 300, { fit: 'cover' })
          .toFile(thumbnailPath);
        
        // Medium (800x800)
        const mediumPath = path.join('uploads/products', `${filename}-medium${ext}`);
        await sharp(originalPath)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .toFile(mediumPath);
        
        // Save to database
        const productImage = await ProductImage.create({
          product_id: productId,
          image_url: `/uploads/products/${file.filename}`,
          thumbnail_url: `/uploads/products/${filename}-thumb${ext}`,
          medium_url: `/uploads/products/${filename}-medium${ext}`,
          is_primary: index === 0,
          sort_order: index
        });
        
        uploadedImages.push(productImage);
      }
      
      return uploadedImages;
    } catch (error) {
      logger.error('Upload product images error:', error);
      throw error;
    }
  }
  
  async deleteImage(imagePath) {
    try {
      const fullPath = path.join(process.cwd(), imagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      logger.error('Delete image error:', error);
    }
  }
}

module.exports = new UploadService();