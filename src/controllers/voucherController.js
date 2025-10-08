import { StatusCodes } from 'http-status-codes'
import { voucherService } from '~/services/voucherService'
import ApiError from '~/utils/ApiError'

// Get all vouchers for current user
const getUserVouchers = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const vouchers = await voucherService.getUserVouchers(userId)

    res.status(StatusCodes.OK).json({
      message: 'Get user vouchers successfully',
      data: vouchers
    })
  } catch (error) {
    next(error)
  }
}

// Get only active vouchers for user
const getActiveVouchers = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const vouchers = await voucherService.getActiveUserVouchers(userId)

    res.status(StatusCodes.OK).json({
      message: 'Get active vouchers successfully',
      data: vouchers
    })
  } catch (error) {
    next(error)
  }
}

// User requests to use a voucher
const requestVoucherUsage = async (req, res, next) => {
  try {
    const { voucherId, productId } = req.body
    const userId = req.jwtDecoded._id

    if (!voucherId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher ID is required')
    }

    const updatedVoucher = await voucherService.requestVoucherUsage(voucherId, userId, productId)

    res.status(StatusCodes.OK).json({
      message: 'Voucher usage requested successfully',
      data: updatedVoucher
    })
  } catch (error) {
    next(error)
  }
}

// Admin confirms voucher usage
const confirmVoucherUsage = async (req, res, next) => {
  try {
    const { voucherId } = req.body
    const adminId = req.jwtDecoded._id

    if (!voucherId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher ID is required')
    }

    const updatedVoucher = await voucherService.confirmVoucherUsage(voucherId, adminId)

    res.status(StatusCodes.OK).json({
      message: 'Voucher usage confirmed successfully',
      data: updatedVoucher
    })
  } catch (error) {
    next(error)
  }
}

// Admin rejects voucher usage
const rejectVoucherUsage = async (req, res, next) => {
  try {
    const { voucherId } = req.body
    const adminId = req.jwtDecoded._id

    if (!voucherId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher ID is required')
    }

    const updatedVoucher = await voucherService.rejectVoucherUsage(voucherId, adminId)

    res.status(StatusCodes.OK).json({
      message: 'Voucher usage rejected successfully',
      data: updatedVoucher
    })
  } catch (error) {
    next(error)
  }
}

// Get pending voucher requests (admin only)
const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await voucherService.getPendingRequests()

    res.status(StatusCodes.OK).json({
      message: 'Get pending requests successfully',
      data: requests
    })
  } catch (error) {
    next(error)
  }
}

// Get voucher details
const getVoucherDetails = async (req, res, next) => {
  try {
    const { voucherId } = req.params
    const userId = req.jwtDecoded._id

    if (!voucherId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Voucher ID is required')
    }

    const voucher = await voucherService.getVoucherById(voucherId, userId)

    res.status(StatusCodes.OK).json({
      message: 'Get voucher details successfully',
      data: voucher
    })
  } catch (error) {
    next(error)
  }
}

// Get voucher stats for user
const getVoucherStats = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const stats = await voucherService.getVoucherStats(userId)

    res.status(StatusCodes.OK).json({
      message: 'Get voucher stats successfully',
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

export const voucherController = {
  getUserVouchers,
  getActiveVouchers,
  requestVoucherUsage,
  confirmVoucherUsage,
  rejectVoucherUsage,
  getPendingRequests,
  getVoucherDetails,
  getVoucherStats
}
