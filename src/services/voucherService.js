import { voucherModel, VOUCHER_STATUS } from '~/models/voucherModel'
import { GamificationConfig, UserGarden } from '~/models/gamificationModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

/**
 * Generate voucher code format: {userId}+{createdDate(YYYYMMDD)}+{expiryDate(YYYYMMDD)}
 * Example: 507f1f77bcf86cd799439011+20231130+20240228
 */
const generateVoucherCode = (userId, createdDate, expiryDate) => {
  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  const createdDateStr = formatDate(createdDate)
  const expiryDateStr = formatDate(expiryDate)
  
  return `${userId}+${createdDateStr}+${expiryDateStr}`
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

    // Generate voucher with new format
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months
    const voucherCode = generateVoucherCode(userId, now, expiresAt)

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
    const now = new Date()
    const voucherCode = generateVoucherCode(userId, now, expiresAt)

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

/**
 * Record voucher sharing to social media or other platform
 * Used to track proof of sharing (for marketing/promotion)
 */
const shareVoucher = async (voucherId, userId, platform, link = '') => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Voucher does not belong to user')
    }

    // Record sharing
    const updatedVoucher = await voucherModel.recordSharing(voucherId, platform, link)

    return updatedVoucher.value
  } catch (error) { throw error }
}

/**
 * Submit proof when user uses the voucher
 * Proof can be a screenshot showing the voucher code was used
 * Or a link to social media post showing the reward
 */
const submitVoucherProof = async (voucherId, userId, proofFile) => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Voucher does not belong to user')
    }

    if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Voucher is ${voucher.status}, cannot submit proof`)
    }

    // Upload proof image to Cloudinary
    let proofUrl = ''
    if (proofFile) {
      try {
        const uploadResult = await CloudinaryProvider.streamUpload(proofFile.buffer, 'voucher-proofs')
        proofUrl = uploadResult.secure_url
      } catch (uploadErr) {
        console.error('[voucherService.submitVoucherProof] Cloudinary upload failed:', uploadErr?.message)
        if (uploadErr?.message?.includes('timeout') || uploadErr?.statusCode === 504) {
          throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'Image upload timed out. Please try again with a smaller file.')
        }
        if (uploadErr?.message?.includes('ECONNRESET') || uploadErr?.message?.includes('ETIMEDOUT')) {
          throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Network error during upload. Please check your connection and try again.')
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Upload failed: ${uploadErr?.message || 'Unknown error'}`)
      }
    }

    // Update voucher with proof and change to PENDING status
    const usageRequest = {
      requestId: `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      requestedAt: Date.now(),
      status: 'pending',
      proofUrl,
      sharedOn: voucher.sharingHistory && voucher.sharingHistory.length > 0 
        ? voucher.sharingHistory[voucher.sharingHistory.length - 1].platform 
        : 'direct'
    }

    const updatedVoucher = await voucherModel.update(voucherId, {
      status: VOUCHER_STATUS.PENDING,
      usageRequest,
      updatedAt: Date.now()
    })

    return updatedVoucher.value
  } catch (error) { 
    if (error instanceof ApiError) throw error
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error?.message || 'Failed to submit voucher proof')
  }
}

/**
 * Admin cancels a voucher
 * @param {string} voucherId - Voucher ID
 * @param {string} adminId - Admin user ID
 * @param {string} cancelReason - Reason for cancellation
 */
const cancelVoucher = async (voucherId, adminId, cancelReason = '') => {
  try {
    const voucher = await voucherModel.findOneById(voucherId)
    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher not found')
    }

    if (voucher.status === 'cancelled') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher is already cancelled')
    }

    if (voucher.status === VOUCHER_STATUS.USED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot cancel a used voucher')
    }

    const updatedVoucher = await voucherModel.update(voucherId, {
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancelledBy: adminId,
      cancelReason,
      updatedAt: Date.now()
    })

    return updatedVoucher.value
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error?.message || 'Failed to cancel voucher')
  }
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
  getVoucherStats,
  shareVoucher,
  submitVoucherProof,
  cancelVoucher
}
