import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminVoucherConfigController } from '~/controllers/adminVoucherConfigController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

// GET /admin/voucher-config - Get current voucher configuration
Router.route('/')
  .get(adminVoucherConfigController.getConfig)

// GET /admin/voucher-config/stats - Get voucher statistics
Router.route('/stats')
  .get(adminVoucherConfigController.getStats)

export const adminVoucherConfigRoute = Router
