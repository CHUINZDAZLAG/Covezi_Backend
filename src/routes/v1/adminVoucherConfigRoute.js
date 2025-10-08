import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminVoucherConfigController } from '~/controllers/adminVoucherConfigController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

// GET /admin/voucher-config - Get current voucher configuration
Router.route('/')
  .get(adminVoucherConfigController.getConfig)

// PUT /admin/voucher-config/:level - Update or create voucher milestone
// DELETE /admin/voucher-config/:level - Delete voucher milestone
Router.route('/:level')
  .put(adminVoucherConfigController.updateMilestone)
  .delete(adminVoucherConfigController.deleteMilestone)

// PUT /admin/voucher-config/validity/days - Update voucher validity period
Router.route('/validity/days')
  .put(adminVoucherConfigController.updateValidity)

// GET /admin/voucher-config/stats - Get voucher statistics
Router.route('/stats')
  .get(adminVoucherConfigController.getStats)

export const adminVoucherConfigRoute = Router
