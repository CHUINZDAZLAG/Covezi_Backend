import express from 'express'
import { voucherController } from '~/controllers/voucherController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { voucherValidation } from '~/validations/voucherValidation'
import multer from 'multer'

const Router = express.Router()
const multerUpload = multer()

// User Voucher Routes
// GET /v1/vouchers - Get all user's vouchers
Router.route('/')
  .get(authMiddleware.isAuthorized, voucherController.getUserVouchers)

// GET /v1/vouchers/active - Get only active vouchers for current user
Router.route('/active')
  .get(authMiddleware.isAuthorized, voucherController.getActiveVouchers)

// POST /v1/vouchers/:voucherId/use - Request to use a voucher
Router.route('/:voucherId/use')
  .post(authMiddleware.isAuthorized, voucherValidation.requestUse, voucherController.requestVoucherUsage)

// POST /v1/vouchers/:voucherId/share - Share voucher to social media platform
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
