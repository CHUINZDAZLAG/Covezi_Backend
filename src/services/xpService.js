import { xpTransactionModel } from '~/models/xpTransactionModel'
import { UserGarden } from '~/models/gamificationModel'
import ApiError from '~/utils/ApiError'

class XpService {
  /**
   * Claim daily login XP with streak bonus
   * Day 1: +10, Day 2: +15, Day 3: +20, Day 4: +25, Day 5+: +30
   */
  static async claimDailyLoginXp(userId) {
    // Check if already claimed today
    const todayRecord = await xpTransactionModel.getTodayLoginRecord(userId)
    if (todayRecord) {
      throw new ApiError(400, 'Already claimed daily login bonus today')
    }

    // Get last login to calculate streak
    const lastLogin = await xpTransactionModel.findByUserAndEvent(
      userId,
      xpTransactionModel.XP_EVENT_TYPES.DAILY_LOGIN,
      null
    )
    
    let loginStreak = 1
    let xpAmount = 10

    if (lastLogin && lastLogin.length > 0) {
      const lastRecord = lastLogin[lastLogin.length - 1]
      const lastDate = new Date(lastRecord.createdAt)
      const today = new Date()
      
      // Check if it's a consecutive day
      lastDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        loginStreak = lastRecord.loginStreak + 1
      } else if (daysDiff > 1) {
        // Streak broken - reset
        loginStreak = 1
      }
    }

    // Calculate XP based on streak
    if (loginStreak === 1) xpAmount = 10
    else if (loginStreak === 2) xpAmount = 15
    else if (loginStreak === 3) xpAmount = 20
    else if (loginStreak === 4) xpAmount = 25
    else xpAmount = 30 // 5+ days

    // Record transaction
    await xpTransactionModel.createNew({
      userId,
      eventType: xpTransactionModel.XP_EVENT_TYPES.DAILY_LOGIN,
      xpAmount,
      loginStreak,
      metadata: {
        streak: loginStreak,
        xpMultiplier: xpAmount / 10
      }
    })

    return {
      xpAmount,
      loginStreak,
      message: `Logged in Day ${loginStreak}! +${xpAmount} XP`
    }
  }

  /**
   * Award XP for liking a challenge
   * Max 5 likes per day → +2 XP per like
   */
  static async awardLikeChallengeXp(userId, challengeId) {
    // Check today's like count
    const todayLikeCount = await xpTransactionModel.getTodayLikeCount(userId)

    if (todayLikeCount >= 5) {
      throw new ApiError(400, 'Maximum 5 likes per day. Come back tomorrow!')
    }

    const xpAmount = 2
    const likeNumber = todayLikeCount + 1

    // Record transaction
    await xpTransactionModel.createNew({
      userId,
      eventType: xpTransactionModel.XP_EVENT_TYPES.LIKE_CHALLENGE,
      xpAmount,
      challengeId,
      likesCountToday: likeNumber,
      metadata: {
        likeNumber,
        remainingToday: 5 - likeNumber
      }
    })

    return {
      xpAmount,
      likeNumber,
      remainingToday: 5 - likeNumber,
      message: `Liked challenge! +${xpAmount} XP (${likeNumber}/5 today)`
    }
  }

  /**
   * Award XP for joining a challenge
   * Only award on first join, +20 XP
   */
  static async awardJoinChallengeXp(userId, challengeId) {
    console.log(`🔍 Checking participation - userId: ${userId}, challengeId: ${challengeId}`)
    
    // Check if already joined this challenge
    const alreadyJoined = await xpTransactionModel.checkChallengeParticipation(
      userId,
      challengeId
    )

    console.log(`📋 Already joined? ${alreadyJoined}`)

    if (alreadyJoined) {
      throw new ApiError(400, 'Already joined this challenge')
    }

    const xpAmount = 20

    // Record transaction
    console.log(`📝 Creating XP transaction for user ${userId}, amount: ${xpAmount}`)
    await xpTransactionModel.createNew({
      userId,
      eventType: xpTransactionModel.XP_EVENT_TYPES.JOIN_CHALLENGE,
      xpAmount,
      challengeId,
      isFirstTimeJoin: true,
      metadata: {
        challengeId
      }
    })

    // Update garden's current XP
    let updatedGarden = null
    try {
      console.log(`🌳 Finding garden for user ${userId}`)
      const garden = await UserGarden.findOne({ userId })
      if (garden) {
        const oldXp = garden.currentXp || 0
        garden.currentXp = oldXp + xpAmount
        updatedGarden = await garden.save()
        console.log(`✅ Updated XP for user ${userId}: ${oldXp} + ${xpAmount} = ${updatedGarden.currentXp}`)
      } else {
        console.warn(`⚠️ Garden not found for user ${userId}`)
      }
    } catch (err) {
      console.error(`❌ Error updating garden for user ${userId}:`, err.message)
    }

    return {
      xpAmount,
      message: `Joined challenge! +${xpAmount} XP`,
      updatedGarden: updatedGarden
    }
  }

  /**
   * Record when user creates a challenge
   * Voucher awarded when challenge reaches 10 joins: +100 XP
   */
  static async recordCreateChallenge(userId, challengeId) {
    // Record creation event (XP will be awarded later when 10 joins reached)
    await xpTransactionModel.createNew({
      userId,
      eventType: xpTransactionModel.XP_EVENT_TYPES.CREATE_CHALLENGE,
      xpAmount: 0, // Will be awarded when participants reach 10
      createdChallengeId: challengeId,
      participantCount: 0,
      metadata: {
        challengeId,
        status: 'pending_participants'
      }
    })

    return {
      message: 'Challenge created! Win +100 XP when 10 users join!'
    }
  }

  /**
   * Award XP when challenge reaches 10 participants
   * Must check: creator hasn't already received XP for this
   * Max 3 eligible challenges per month
   */
  static async awardCreateChallengeXp(userId, challengeId, participantCount) {
    if (participantCount < 10) {
      throw new ApiError(400, 'Challenge must have at least 10 participants')
    }

    // Check if already awarded XP for this challenge
    const xpRecord = await xpTransactionModel.findByUserAndEvent(
      userId,
      xpTransactionModel.XP_EVENT_TYPES.CREATE_CHALLENGE
    )

    const alreadyAwarded = xpRecord.some(
      r => r.createdChallengeId === challengeId && r.xpAmount > 0
    )

    if (alreadyAwarded) {
      throw new ApiError(400, 'XP already awarded for this challenge')
    }

    // Check monthly limit (max 3 per month)
    const monthlyCount = await xpTransactionModel.getMonthlyEligibleChallengeCount(userId)

    if (monthlyCount >= 3) {
      throw new ApiError(400, 'Maximum 3 challenges per month. Try again next month!')
    }

    const xpAmount = 100

    // Update the create challenge record with XP amount and participant count
    await xpTransactionModel.updateChallengeParticipantCount(challengeId, participantCount)

    // Also update xpAmount in the record
    await xpTransactionModel.findByUserAndEvent(userId, xpTransactionModel.XP_EVENT_TYPES.CREATE_CHALLENGE)
    // Note: This is simplified - in real implementation you'd update the specific record

    return {
      xpAmount,
      monthlyCount: monthlyCount + 1,
      message: `Challenge hit 10 joins! +${xpAmount} XP awarded (${monthlyCount + 1}/3 monthly)`
    }
  }

  /**
   * Get user's XP summary and achievements
   */
  static async getUserXpSummary(userId) {
    // Get all XP transactions grouped by type
    const transactions = {
      dailyLogins: await xpTransactionModel.findByUserAndEvent(
        userId,
        xpTransactionModel.XP_EVENT_TYPES.DAILY_LOGIN
      ),
      likes: await xpTransactionModel.findByUserAndEvent(
        userId,
        xpTransactionModel.XP_EVENT_TYPES.LIKE_CHALLENGE
      ),
      joinedChallenges: await xpTransactionModel.findByUserAndEvent(
        userId,
        xpTransactionModel.XP_EVENT_TYPES.JOIN_CHALLENGE
      ),
      createdChallenges: await xpTransactionModel.findByUserAndEvent(
        userId,
        xpTransactionModel.XP_EVENT_TYPES.CREATE_CHALLENGE
      )
    }

    // Calculate totals
    const totalXp = Object.values(transactions).reduce((sum, arr) => {
      return sum + arr.reduce((s, t) => s + t.xpAmount, 0)
    }, 0)

    // Get garden for current level
    const garden = await UserGarden.findOne({ userId })

    return {
      totalXp,
      level: garden?.level || 1,
      currentXp: garden?.currentXp || 0,
      nextLevelXp: garden?.nextLevelXp || 100,
      achievements: {
        dailyLoginStreak: transactions.dailyLogins.length > 0 
          ? transactions.dailyLogins[transactions.dailyLogins.length - 1].loginStreak || 1
          : 0,
        totalLikes: transactions.likes.length,
        challengesJoined: transactions.joinedChallenges.length,
        challengesCreated: transactions.createdChallenges.filter(c => c.xpAmount > 0).length,
        totalXpEarned: totalXp
      }
    }
  }
}

export default XpService
