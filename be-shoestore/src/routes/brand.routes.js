const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Product brands management
 */

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 */
router.get('/', brandController.getBrands);

/**
 * @swagger
 * /api/v1/brands/{brandId}:
 *   get:
 *     summary: Get brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *       404:
 *         description: Brand not found
 */
router.get('/:brandId', brandController.getBrandById);

/**
 * @swagger
 * /api/v1/brands/{brandId}/products:
 *   get:
 *     summary: Get products by brand
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/:brandId/products', brandController.getProductsByBrand);

module.exports = router;
