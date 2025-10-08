import { StatusCodes } from 'http-status-codes'
import { voucherModel } from '~/models/voucherModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'

class AdminUserVoucherHistoryController {
  /**
   * Get all vouchers for a specific user
   * GET /admin/users/:userId/voucher-history
   */
  static async getUserVoucherHistory(req, res, next) {
    try {
      const { userId } = req.params

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      // Get all vouchers for this user with detailed info
      const vouchers = await voucherModel.findAll({
        userId,
        _destroy: false
      }, { sort: { createdAt: -1 } })

      const summary = {
        totalVouchers: vouchers.length,
        active: vouchers.filter(v => v.status === 'active').length,
        pending: vouchers.filter(v => v.status === 'pending').length,
        used: vouchers.filter(v => v.status === 'used').length,
        rejected: vouchers.filter(v => v.status === 'rejected').length,
        expired: vouchers.filter(v => v.status === 'expired').length
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          userId,
          userEmail: user.email,
          displayName: user.displayName,
          summary,
          vouchers
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Get vouchers by status for a user
   * GET /admin/users/:userId/voucher-history/:status
   */
  static async getUserVouchersByStatus(req, res, next) {
    try {
      const { userId, status } = req.params

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      const validStatuses = ['active', 'pending', 'used', 'rejected', 'expired']
      if (!validStatuses.includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      }

      const vouchers = await voucherModel.findAll({
        userId,
        status,
        _destroy: false
      }, { sort: { createdAt: -1 } })

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          userId,
          userEmail: user.email,
          status,
          count: vouchers.length,
          vouchers
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Confirm pending voucher usage (admin approves)
   * POST /admin/users/:userId/vouchers/:voucherId/confirm
   */
  static async confirmVoucherUsage(req, res, next) {
    try {
      const { userId, voucherId } = req.params
      const adminId = req.jwtDecoded._id

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      const updatedVoucher = await voucherModel.update(voucherId, {
        status: 'used',
        confirmedAt: Date.now(),
        confirmedBy: adminId
      })

      if (!updatedVoucher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Voucher usage confirmed',
        data: updatedVoucher.value
      })
    } catch (error) { next(error) }
  }

  /**
   * Reject pending voucher usage (admin rejects)
   * POST /admin/users/:userId/vouchers/:voucherId/reject
   */
  static async rejectVoucherUsage(req, res, next) {
    try {
      const { userId, voucherId } = req.params
      const { reason } = req.body
      const adminId = req.jwtDecoded._id

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      const updatedVoucher = await voucherModel.update(voucherId, {
        status: 'active',
        rejectedAt: Date.now(),
        rejectedBy: adminId,
        rejectionReason: reason || 'Rejected by admin'
      })

      if (!updatedVoucher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Voucher usage rejected and restored to active',
        data: updatedVoucher.value
      })
    } catch (error) { next(error) }
  }

  /**
   * Manually revoke a voucher
   * POST /admin/users/:userId/vouchers/:voucherId/revoke
   */
  static async revokeVoucher(req, res, next) {
    try {
      const { userId, voucherId } = req.params
      const { reason } = req.body
      const adminId = req.jwtDecoded._id

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      const updatedVoucher = await voucherModel.update(voucherId, {
        status: 'expired',
        revokedAt: Date.now(),
        revokedBy: adminId,
        revocationReason: reason || 'Revoked by admin'
      })

      if (!updatedVoucher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Voucher revoked',
        data: updatedVoucher.value
      })
    } catch (error) { next(error) }
  }

  /**
   * Get voucher statistics across all users
   * GET /admin/voucher-history/stats
   */
  static async getGlobalVoucherStats(req, res, next) {
    try {
      const stats = await voucherModel.getGlobalStats()

      res.status(StatusCodes.OK).json({
        success: true,
        data: stats
      })
    } catch (error) { next(error) }
  }
}

export const adminUserVoucherHistoryController = AdminUserVoucherHistoryController
