/**
 * @swagger
 * tags:
 *   - name: Admin - Voucher Config
 *     description: 🔑 Admin voucher configuration management
 */

import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminVoucherConfigController } from '~/controllers/adminVoucherConfigController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

/**
 * @swagger
 * /v1/admin/voucher-config:
 *   get:
 *     tags: [Admin - Voucher Config]
 *     summary: 📈 Get voucher configuration
 *     description: Get current voucher system configuration and level milestones
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Voucher config retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     levelMilestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: number
 *                             example: 5
 *                           voucherType:
 *                             type: string
 *                             example: "discount_percentage"
 *                           value:
 *                             type: number
 *                             example: 10
 *                           description:
 *                             type: string
 *                             example: "10% off for reaching level 5"
 *                     globalSettings:
 *                       type: object
 *                       properties:
 *                         maxActiveVouchers:
 *                           type: number
 *                           example: 5
 *                         defaultExpiryDays:
 *                           type: number
 *                           example: 30
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
Router.route('/')
  .get(adminVoucherConfigController.getConfig)

/**
 * @swagger
 * /v1/admin/voucher-config/stats:
 *   get:
 *     tags: [Admin - Voucher Config]
 *     summary: 📊 Get voucher statistics
 *     description: Get comprehensive statistics about voucher usage and performance
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Voucher statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIssued:
 *                       type: number
 *                       example: 1247
 *                     totalUsed:
 *                       type: number
 *                       example: 856
 *                     totalExpired:
 *                       type: number
 *                       example: 123
 *                     usageRate:
 *                       type: number
 *                       example: 68.7
 *                       description: "Percentage of vouchers used"
 *                     byLevel:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: number
 *                           issued:
 *                             type: number
 *                           used:
 *                             type: number
 *                     byType:
 *                       type: object
 *                       properties:
 *                         discount_percentage:
 *                           type: object
 *                           properties:
 *                             issued:
 *                               type: number
 *                             used:
 *                               type: number
 *                         discount_fixed:
 *                           type: object
 *                         free_shipping:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
Router.route('/stats')
  .get(adminVoucherConfigController.getStats)

export const adminVoucherConfigRoute = Router
