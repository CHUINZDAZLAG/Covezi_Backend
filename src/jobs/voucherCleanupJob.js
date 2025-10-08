/* eslint-disable no-console */
import cron from 'node-cron'
import { voucherModel } from '~/models/voucherModel'

/**
 * Schedule voucher expiry cleanup job
 * Runs daily at 2 AM to delete expired vouchers
 */
export const scheduleVoucherCleanupJob = () => {
  // Run every day at 02:00 (2 AM)
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('⏰ Running scheduled voucher cleanup job...')
      
      const now = new Date()
      
      // Find and delete expired vouchers
      const result = await voucherModel.deleteExpiredVouchers(now)
      
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted ${result.deletedCount} expired vouchers`)
      } else {
        console.log('✅ No expired vouchers found')
      }
    } catch (error) {
      console.error('❌ Error running voucher cleanup job:', error.message)
    }
  })

  console.log('✅ Voucher cleanup job scheduled to run daily at 02:00')
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
      const result = await voucherModel.deleteExpiredVouchers(now)
      
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted ${result.deletedCount} expired vouchers`)
      } else {
        console.log('✅ No expired vouchers found')
      }
    } catch (error) {
      console.error('❌ Error running voucher cleanup job:', error.message)
    }
  })

  console.log('✅ Voucher cleanup job scheduled to run every 6 hours')
}

/**
 * Manual cleanup trigger (for admin dashboard)
 */
export const triggerVoucherCleanupManual = async () => {
  try {
    const now = new Date()
    const result = await voucherModel.deleteExpiredVouchers(now)
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Manually deleted ${result.deletedCount} expired vouchers`
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}
