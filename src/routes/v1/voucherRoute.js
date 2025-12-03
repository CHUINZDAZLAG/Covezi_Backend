/**
 * @swagger
 * tags:
 *   - name: Vouchers
 *     description: 🎁 Voucher rewards, level milestones, and discount management
 */

import express from 'express'
import { voucherController } from '~/controllers/voucherController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { voucherValidation } from '~/validations/voucherValidation'
import multer from 'multer'

const Router = express.Router()
const multerUpload = multer()

/**
 * @swagger
 * /v1/vouchers:
 *   get:
 *     tags: [Vouchers]
 *     summary: 📋 Get all user's vouchers
 *     description: Retrieve complete voucher history including used, expired, and active vouchers for authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ User vouchers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       voucherType:
 *                         type: string
 *                         enum: [discount_percentage, discount_fixed, free_shipping]
 *                       value:
 *                         type: number
 *                       requiredLevel:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [active, used, expired, pending]
 *                       expiresAt:
 *                         type: number
 *                       usedAt:
 *                         type: number
 *                       createdAt:
 *                         type: number
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     active:
 *                       type: number
 *                     used:
 *                       type: number
 *                     expired:
 *                       type: number
 *             example:
 *               success: true
 *               data:
 *                 - _id: "674f1234567890abcdef1234"
 *                   voucherType: "discount_percentage"
 *                   value: 10
 *                   requiredLevel: 5
 *                   status: "active"
 *                   expiresAt: 1735689600000
 *                   createdAt: 1733097600000
 *               summary:
 *                 total: 12
 *                 active: 3
 *                 used: 7
 *                 expired: 2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
Router.route('/')
  .get(authMiddleware.isAuthorized, voucherController.getUserVouchers)

/**
 * @swagger
 * /v1/vouchers/active:
 *   get:
 *     tags: [Vouchers]
 *     summary: ✨ Get active vouchers
 *     description: Get only active (unused & non-expired) vouchers for current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Active vouchers retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       voucherType:
 *                         type: string
 *                       value:
 *                         type: number
 *                       minOrderValue:
 *                         type: number
 *                       maxDiscountAmount:
 *                         type: number
 *                       expiresAt:
 *                         type: number
 *                       timeUntilExpiry:
 *                         type: string
 *             example:
 *               success: true
 *               data:
 *                 - _id: "674f1234567890abcdef1234"
 *                   voucherType: "discount_percentage"
 *                   value: 15
 *                   minOrderValue: 100000
 *                   maxDiscountAmount: 50000
 *                   expiresAt: 1735689600000
 *                   timeUntilExpiry: "5 days remaining"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
Router.route('/active')
  .get(authMiddleware.isAuthorized, voucherController.getActiveVouchers)

/**
 * @swagger
 * /v1/vouchers/{voucherId}/use:
 *   post:
 *     tags: [Vouchers]
 *     summary: 🎫 Request to use voucher
 *     description: Submit voucher usage request with order details. Requires admin approval.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: voucherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID to use
 *         example: "674f1234567890abcdef1234"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - orderValue
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to apply voucher
 *                 example: "674f9876543210fedcba9876"
 *               orderValue:
 *                 type: number
 *                 description: Total order value in VND
 *                 example: 500000
 *               note:
 *                 type: string
 *                 description: Optional usage note
 *                 example: "Using for eco-product purchase"
 *     responses:
 *       200:
 *         description: ✅ Voucher usage request submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Voucher usage request submitted. Awaiting admin approval."
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     expectedDiscount:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: ❌ Voucher not found or expired
 */
Router.route('/:voucherId/use')
  .post(authMiddleware.isAuthorized, voucherValidation.requestUse, voucherController.requestVoucherUsage)

/**
 * @swagger
 * /v1/vouchers/{voucherId}/share:
 *   post:
 *     tags: [Vouchers]
 *     summary: 📱 Share voucher to social media
 *     description: Share voucher achievement to social platforms (Facebook, Instagram, etc.) for bonus XP
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: voucherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [facebook, instagram, twitter, linkedin]
 *                 example: "facebook"
 *               caption:
 *                 type: string
 *                 example: "Just earned a new eco-voucher on Covezi! 🌳🎁"
 *     responses:
 *       200:
 *         description: ✅ Voucher shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Voucher shared successfully! +10 XP bonus earned."
 *                 data:
 *                   type: object
 *                   properties:
 *                     xpBonus:
 *                       type: number
 *                       example: 10
 *                     shareUrl:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
Router.route('/:voucherId/share')
  .post(authMiddleware.isAuthorized, voucherController.shareVoucher)

// POST /v1/vouchers/:voucherId/proof - Submit proof of voucher usage (screenshot)
Router.route('/:voucherId/proof')
  .post(authMiddleware.isAuthorized, multerUpload.single('proof'), voucherController.submitVoucherProof)

// GET /v1/vouchers/:voucherId - Get voucher details
Router.route('/:voucherId')
  .get(authMiddleware.isAuthorized, voucherController.getVoucherDetails)

// GET /v1/vouchers/stats/summary - Get voucher stats for current user
Router.route('/stats/summary')
  .get(authMiddleware.isAuthorized, voucherController.getVoucherStats)

// Admin Voucher Routes
// GET /v1/admin/vouchers/pending - Get pending voucher requests (admin only)
Router.route('/admin/pending')
  .get(authMiddleware.isAuthorized, authMiddleware.isAdmin, voucherController.getPendingRequests)

// POST /v1/admin/vouchers/:voucherId/confirm - Confirm voucher usage (admin only)
Router.route('/admin/:voucherId/confirm')
  .post(authMiddleware.isAuthorized, authMiddleware.isAdmin, voucherValidation.confirmUsage, voucherController.confirmVoucherUsage)

// POST /v1/admin/vouchers/:voucherId/reject - Reject voucher usage (admin only)
Router.route('/admin/:voucherId/reject')
  .post(authMiddleware.isAuthorized, authMiddleware.isAdmin, voucherController.rejectVoucherUsage)

export const voucherRoute = Router
