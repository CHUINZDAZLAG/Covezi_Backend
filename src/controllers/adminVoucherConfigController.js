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
   * Update or create a voucher milestone
   * PUT /admin/voucher-config/:level
   * Body: { level, discountPercent, description }
   */
  static async updateMilestone(req, res, next) {
    try {
      const { level } = req.params
      const { discountPercent, description } = req.body

      if (!level || level < 1 || isNaN(level)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid level number')
      }

      if (discountPercent === undefined || discountPercent < 0 || discountPercent > 100) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Discount must be 0-100%')
      }

      const config = await GamificationService.updateVoucherMilestone(
        parseInt(level),
        parseInt(discountPercent),
        description
      )

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Voucher milestone at Level ${level} updated to ${discountPercent}%`,
        data: {
          voucherMilestones: config.voucherMilestones
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Delete a voucher milestone
   * DELETE /admin/voucher-config/:level
   */
  static async deleteMilestone(req, res, next) {
    try {
      const { level } = req.params

      if (!level || level < 1 || isNaN(level)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid level number')
      }

      const config = await GamificationService.deleteVoucherMilestone(parseInt(level))

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Voucher milestone at Level ${level} deleted`,
        data: {
          voucherMilestones: config.voucherMilestones
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Update voucher validity period (in days)
   * PUT /admin/voucher-config/validity/days
   * Body: { voucherValidityDays }
   */
  static async updateValidity(req, res, next) {
    try {
      const { voucherValidityDays } = req.body

      if (!voucherValidityDays || voucherValidityDays < 1 || isNaN(voucherValidityDays)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Validity days must be a positive number')
      }

      const config = await GamificationService.getConfig()
      config.voucherValidityDays = voucherValidityDays
      await config.save()

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Voucher validity period updated to ${voucherValidityDays} days`,
        data: {
          voucherValidityDays: config.voucherValidityDays
        }
      })
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
