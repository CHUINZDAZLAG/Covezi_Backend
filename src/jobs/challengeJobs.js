import cron from 'node-cron'
import { challengeModel } from '~/models/challengeModel'

// Cron job to manage challenge lifecycle
// Runs every hour to check for expired challenges and cleanup

const initChallengeJobs = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running challenge cleanup job...')

    try {
      // 1. Mark expired challenges
      await markExpiredChallenges()

      // 2. Delete challenges past grace period
      await deletePastGracePeriodChallenges()

      console.log('[CRON] Challenge cleanup completed')
    } catch (error) {
      console.error('[CRON] Error in challenge cleanup:', error)
    }
  })

  console.log('[CRON] Challenge cleanup job scheduled (runs every hour)')
}

// Mark challenges as expired when endDate has passed
const markExpiredChallenges = async () => {
  try {
    const expiredChallenges = await challengeModel.getChallengesForExpiration()

    for (const challenge of expiredChallenges) {
      await challengeModel.markExpired(challenge._id.toString())
      console.log(`[CRON] Marked challenge as expired: ${challenge.title}`)
    }

    return expiredChallenges.length
  } catch (error) {
    console.error('[CRON] Error marking expired challenges:', error)
    throw error
  }
}

// Delete challenges after grace period (deleteAfter date)
// Comments are embedded in challenge document so they will be deleted together
const deletePastGracePeriodChallenges = async () => {
  try {
    const challengesToDelete = await challengeModel.getChallengesForDeletion()

    for (const challenge of challengesToDelete) {
      const challengeId = challenge._id.toString()

      // Hard delete the challenge (comments are embedded, so deleted together)
      await challengeModel.hardDeleteById(challengeId)
      console.log(`[CRON] Deleted challenge: ${challenge.title} (${challenge.commentCount} comments)`)
    }

    return challengesToDelete.length
  } catch (error) {
    console.error('[CRON] Error deleting past grace period challenges:', error)
    throw error
  }
}

// Manual cleanup function (can be called from admin endpoint)
const runCleanupManually = async () => {
  console.log('[MANUAL] Running challenge cleanup...')

  const expiredCount = await markExpiredChallenges()
  const deletedCount = await deletePastGracePeriodChallenges()

  return {
    expiredChallenges: expiredCount,
    deletedChallenges: deletedCount
  }
}

export const challengeCronJobs = {
  initChallengeJobs,
  markExpiredChallenges,
  deletePastGracePeriodChallenges,
  runCleanupManually
}
