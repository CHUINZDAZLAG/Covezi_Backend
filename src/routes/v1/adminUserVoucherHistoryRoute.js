import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminUserVoucherHistoryController } from '~/controllers/adminUserVoucherHistoryController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

// GET /admin/voucher-history/stats - Get global voucher statistics
Router.route('/stats')
  .get(adminUserVoucherHistoryController.getGlobalVoucherStats)

// GET /admin/voucher-history/search - Search users by email/username with vouchers
Router.route('/search')
  .get(adminUserVoucherHistoryController.searchUsers)

// GET /admin/voucher-history/users/:userId - Get user's voucher history
Router.route('/users/:userId')
  .get(adminUserVoucherHistoryController.getUserVoucherHistory)

// GET /admin/voucher-history/users/:userId/:status - Get vouchers by status
Router.route('/users/:userId/:status')
  .get(adminUserVoucherHistoryController.getUserVouchersByStatus)

// POST /admin/voucher-history/users/:userId/vouchers/:voucherId/confirm - Confirm voucher usage
Router.route('/users/:userId/vouchers/:voucherId/confirm')
  .post(adminUserVoucherHistoryController.confirmVoucherUsage)

// POST /admin/voucher-history/users/:userId/vouchers/:voucherId/cancel - Cancel voucher
Router.route('/users/:userId/vouchers/:voucherId/cancel')
  .post(adminUserVoucherHistoryController.cancelVoucher)

// POST /admin/voucher-history/users/:userId/vouchers/:voucherId/reject - Reject voucher usage
Router.route('/users/:userId/vouchers/:voucherId/reject')
  .post(adminUserVoucherHistoryController.rejectVoucherUsage)

// POST /admin/voucher-history/users/:userId/vouchers/:voucherId/revoke - Revoke voucher
Router.route('/users/:userId/vouchers/:voucherId/revoke')
  .post(adminUserVoucherHistoryController.revokeVoucher)

// DELETE /admin/voucher-history/users/:userId/vouchers/:voucherId/delete - Delete voucher permanently
Router.route('/users/:userId/vouchers/:voucherId/delete')
  .delete(adminUserVoucherHistoryController.deleteVoucher)

export const adminUserVoucherHistoryRoute = Router
