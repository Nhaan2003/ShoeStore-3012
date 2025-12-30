const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const { isStaff } = require('../../middlewares/role.middleware');
const orderStaffController = require('../../controllers/staff/order.staff.controller');

// Apply authentication and staff role middleware to all staff routes
router.use(authMiddleware, isStaff);

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff order management endpoints
 */

/**
 * @swagger
 * /api/v1/staff/orders:
 *   get:
 *     summary: Get orders assigned to staff or all orders (for processing)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
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
 *         description: Orders retrieved successfully
 */
router.get('/orders', orderStaffController.getOrders);

/**
 * @swagger
 * /api/v1/staff/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Staff]
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
router.get('/orders/:orderId', orderStaffController.getOrderById);

/**
 * @swagger
 * /api/v1/staff/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Staff]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, processing, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.put('/orders/:orderId/status', orderStaffController.updateOrderStatus);

/**
 * @swagger
 * /api/v1/staff/orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Staff]
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
 */
router.post('/orders/:orderId/cancel', orderStaffController.cancelOrder);

/**
 * @swagger
 * /api/v1/staff/orders/stats:
 *   get:
 *     summary: Get staff order statistics
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', orderStaffController.getStats);

module.exports = router;
