import { StatusCodes } from 'http-status-codes'
import GamificationService from '~/services/gamificationService'
import ApiError from '~/utils/ApiError'

class AdminVoucherConfigController {
  /**
   * Get current voucher configuration
   * GET /admin/voucher-config
   */
  static async getConfig(req, res, next) {
    try {
      const config = await GamificationService.getConfig()

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          voucherMilestones: config.voucherMilestones,
          voucherValidityDays: config.voucherValidityDays,
          description: 'Level thresholds for automatic voucher generation'
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * DEPRECATED: Update or create a voucher milestone
   * This endpoint has been disabled. Voucher milestones are now managed automatically.
   */
  static async updateMilestone(req, res, next) {
    try {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Level-based voucher management has been disabled. Vouchers are now managed per user.')
    } catch (error) { next(error) }
  }

  /**
   * DEPRECATED: Delete a voucher milestone
   * This endpoint has been disabled. Voucher milestones are now managed automatically.
   */
  static async deleteMilestone(req, res, next) {
    try {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Level-based voucher management has been disabled. Vouchers are now managed per user.')
    } catch (error) { next(error) }
  }

  /**
   * DEPRECATED: Update voucher validity period
   * This endpoint has been disabled. Voucher validity is managed automatically.
   */
  static async updateValidity(req, res, next) {
    try {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Voucher validity management has been disabled. Use voucherService for programmatic updates.')
    } catch (error) { next(error) }
  }

  /**
   * Get all voucher statistics (admin dashboard)
   * GET /admin/voucher-config/stats
   */
  static async getStats(req, res, next) {
    try {
      const stats = await GamificationService.getVoucherStats()

      res.status(StatusCodes.OK).json({
        success: true,
        data: stats
      })
    } catch (error) { next(error) }
  }
}

export const adminVoucherConfigController = AdminVoucherConfigController
