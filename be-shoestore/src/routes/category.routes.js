const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product categories management
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: include_children
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include child categories
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/tree:
 *   get:
 *     summary: Get categories as tree structure
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:categoryId', categoryController.getCategoryById);

/**
 * @swagger
 * /api/v1/categories/{categoryId}/products:
 *   get:
 *     summary: Get products by category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
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
router.get('/:categoryId/products', categoryController.getProductsByCategory);

module.exports = router;
