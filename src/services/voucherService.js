import { voucherModel, VOUCHER_STATUS } from '~/models/voucherModel'
import { GamificationConfig, UserGarden } from '~/models/gamificationModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

// Generate unique voucher code: userId+level (e.g., 77150 for userId=77, level=150)
const generateVoucherCode = (userId, level) => {
  return `${userId}${level}`.toUpperCase()
}

/**
 * Check if user reached a voucher milestone and generate voucher
 * Called when user levels up
 */
const generateVoucherForLevelMilestone = async (userId, newLevel) => {
  try {
    const config = await GamificationConfig.findOne()
    if (!config) return null

    // Find matching milestone
    const milestone = config.voucherMilestones.find(m => m.level === newLevel)
    if (!milestone) return null

    // Check if voucher already exists for this level
    const existingVoucher = await voucherModel.findOne({
      userId,
      levelReward: newLevel
    })
    if (existingVoucher) return null

    // Generate voucher
    const voucherCode = generateVoucherCode(userId, newLevel)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months

    const newVoucher = {
      voucherCode,
      userId,
      percent: milestone.discountPercent,
      levelReward: newLevel,
      status: VOUCHER_STATUS.ACTIVE,
      expiresAt,
      description: `Earned at Level ${newLevel} - ${milestone.discountPercent}% discount`
    }

    const result = await voucherModel.createNew(newVoucher)
    
    // Update user garden to track voucher milestone
    const garden = await UserGarden.findOne({ userId })
    if (garden) {
      garden.voucherMilestonesClaimed.push({
        level: newLevel,
        claimedAt: now,
        discountPercent: milestone.discountPercent
      })
      garden.vouchersReceived.push(result.insertedId)
      await garden.save()
    }

    return {
      voucherId: result.insertedId,
      voucherCode,
      discountPercent: milestone.discountPercent,
      expiresAt
    }
  } catch (error) { throw error }
}

// Create voucher when user levels up
const createVoucherForLevelUp = async (userId, level, percent, expiresAt) => {
  try {
    const voucherCode = generateVoucherCode(userId, level)

    const newVoucher = {
      voucherCode,
      userId,
      percent,
      levelReward: level,
      status: VOUCHER_STATUS.ACTIVE,
      expiresAt,
      description: `Earned at Level ${level}`
    }

    const result = await voucherModel.createNew(newVoucher)
    return result
  } catch (error) { throw error }
}

// Get all vouchers for user (with filtering)
const getUserVouchers = async (userId) => {
  try {
    const vouchers = await voucherModel.getByUserId(userId)
    return vouchers
  } catch (error) { throw error }
}

// Get active vouchers only
const getActiveUserVouchers = async (userId) => {
  try {
    const vouchers = await voucherModel.getActiveByUserId(userId)
    return vouchers
  } catch (error) { throw error }
}

// Get single voucher by ID with user verification
const getVoucherById = async (voucherId, userId) => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Voucher does not belong to user')
    }

    return voucher
  } catch (error) { throw error }
}

// User requests to use a voucher
const requestVoucherUsage = async (voucherId, userId, productId = null) => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Voucher does not belong to user')
    }

    if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Voucher status is ${voucher.status}, cannot use`)
    }

    if (voucher.expiresAt < Date.now()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher has expired')
    }

    // Update voucher to pending status
    const usageRequest = {
      requestId: `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      requestedAt: Date.now(),
      status: 'pending'
    }

    const updatedVoucher = await voucherModel.update(voucherId, {
      status: VOUCHER_STATUS.PENDING,
      usageRequest,
      productId: productId || ''
    })

    return updatedVoucher.value
  } catch (error) { throw error }
}

// Admin confirms voucher usage
const confirmVoucherUsage = async (voucherId, adminId) => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.status !== VOUCHER_STATUS.PENDING) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher is not in pending status')
    }

    // Update voucher to used
    const updatedVoucher = await voucherModel.update(voucherId, {
      status: VOUCHER_STATUS.USED,
      confirmedAt: Date.now(),
      confirmedBy: adminId
    })

    return updatedVoucher.value
  } catch (error) { throw error }
}

// Admin rejects voucher usage (returns to active)
const rejectVoucherUsage = async (voucherId, adminId) => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.status !== VOUCHER_STATUS.PENDING) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher is not in pending status')
    }

    // Update voucher back to active with audit trail
    const updatedVoucher = await voucherModel.update(voucherId, {
      status: VOUCHER_STATUS.ACTIVE,
      usageRequest: null,
      rejectedBy: adminId,
      rejectedAt: Date.now()
    })

    return updatedVoucher.value
  } catch (error) { throw error }
}

// Get pending requests for admin dashboard
const getPendingRequests = async () => {
  try {
    const requests = await voucherModel.getPendingRequests()
    return requests
  } catch (error) { throw error }
}

// Get voucher statistics
const getVoucherStats = async (userId = null) => {
  try {
    let query = {}
    if (userId) {
      query.userId = userId
    }

    const stats = {
      active: 0,
      pending: 0,
      used: 0,
      rejected: 0
    }

    if (userId) {
      const vouchers = await voucherModel.getByUserId(userId)
      vouchers.forEach(v => {
        if (v.status === VOUCHER_STATUS.ACTIVE) stats.active++
        else if (v.status === VOUCHER_STATUS.PENDING) stats.pending++
        else if (v.status === VOUCHER_STATUS.USED) stats.used++
        else if (v.status === VOUCHER_STATUS.REJECTED) stats.rejected++
      })
    }

    return stats
  } catch (error) { throw error }
}

export const voucherService = {
  generateVoucherCode,
  generateVoucherForLevelMilestone,
  createVoucherForLevelUp,
  getUserVouchers,
  getActiveUserVouchers,
  getVoucherById,
  requestVoucherUsage,
  confirmVoucherUsage,
  rejectVoucherUsage,
  getPendingRequests,
  getVoucherStats
}
