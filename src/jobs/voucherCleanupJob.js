/* eslint-disable no-console */
import cron from 'node-cron'
import { voucherModel } from '~/models/voucherModel'

/**
 * Schedule voucher expiry cleanup job
 * Runs daily at 2 AM to delete vouchers that have been expired for 3 months or more
 * Formula: Voucher is deleted if (currentTime - expiryTime) >= 3 months
 */
export const scheduleVoucherCleanupJob = () => {
  // Run every day at 02:00 (2 AM)
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('⏰ Running scheduled voucher cleanup job...')
      
      const now = new Date()
      // Calculate the cutoff date: 3 months ago
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      
      // Find and delete vouchers that expired 3+ months ago
      const result = await voucherModel.deleteExpiredVouchers(threeMonthsAgo)
      
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted ${result.deletedCount} vouchers that expired 3+ months ago`)
      } else {
        console.log('✅ No vouchers eligible for cleanup found')
      }
    } catch (error) {
      console.error('❌ Error running voucher cleanup job:', error.message)
    }
  })

  console.log('✅ Voucher cleanup job scheduled to run daily at 02:00 - removes vouchers expired 3+ months ago')
}

/**
 * Alternative: Run cleanup every 6 hours (for testing/high-frequency scenarios)
 */
export const scheduleVoucherCleanupJobFrequent = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('⏰ Running scheduled voucher cleanup job (6-hour interval)...')
      
      const now = new Date()
      // Calculate the cutoff date: 3 months ago
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      
      const result = await voucherModel.deleteExpiredVouchers(threeMonthsAgo)
      
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted ${result.deletedCount} vouchers that expired 3+ months ago`)
      } else {
        console.log('✅ No vouchers eligible for cleanup found')
      }
    } catch (error) {
      console.error('❌ Error running voucher cleanup job:', error.message)
    }
  })

  console.log('✅ Voucher cleanup job scheduled to run every 6 hours - removes vouchers expired 3+ months ago')
}

/**
 * Manual cleanup trigger (for admin dashboard)
 * Deletes vouchers that have been expired for 3+ months
 */
export const triggerVoucherCleanupManual = async () => {
  try {
    const now = new Date()
    // Calculate the cutoff date: 3 months ago
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    const result = await voucherModel.deleteExpiredVouchers(threeMonthsAgo)
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Manually deleted ${result.deletedCount} vouchers that expired 3+ months ago`
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}
