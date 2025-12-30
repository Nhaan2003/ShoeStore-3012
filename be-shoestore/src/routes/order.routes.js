const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const orderValidator = require('../validators/order.validator');
const validate = require('../middlewares/validation.middleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management for customers
 */

// All order routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [unpaid, pending, completed, failed, refunded]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipping_name
 *               - shipping_phone
 *               - shipping_address
 *             properties:
 *               shipping_name:
 *                 type: string
 *               shipping_phone:
 *                 type: string
 *               shipping_address:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [COD, BANK_TRANSFER, VNPAY, MOMO, ZALOPAY]
 *                 default: COD
 *               notes:
 *                 type: string
 *               promotion_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request or cart is empty
 */
router.post('/', orderValidator.createOrder, validate, orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', orderController.getOrderById);

/**
 * @swagger
 * /api/v1/orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/cancel', orderController.cancelOrder);

/**
 * @swagger
 * /api/v1/orders/track/{orderCode}:
 *   get:
 *     summary: Track order by order code
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order tracking info retrieved
 *       404:
 *         description: Order not found
 */
router.get('/track/:orderCode', orderController.trackOrder);

module.exports = router;
