/**
 * 🎯 Automatic Point Calculation Service
 * 
 * This service automatically calculates and awards points for various user actions
 * to encourage eco-friendly behavior and platform engagement.
 */

import GamificationService from '~/services/gamificationService.js'
import { UserGarden } from '~/models/gamificationModel.js'
import ApiError from '~/utils/ApiError.js'

class AutomaticPointService {
  
  /**
   * 🏪 E-COMMERCE ACTIONS - Points for purchases
   */
  
  /**
   * Award points for purchasing eco-friendly products
   * @param {string} userId - User ID
   * @param {Object} order - Order details
   * @returns {Object} Point calculation result
   */
  static async awardPurchasePoints(userId, order) {
    try {
      let totalPoints = 0
      let breakdown = []

      // Base points per dollar spent (1 point = 1000 VND)
      const basePoints = Math.floor(order.totalAmount / 1000)
      totalPoints += basePoints
      breakdown.push({
        action: 'purchase_base',
        points: basePoints,
        description: `Base purchase: ${order.totalAmount.toLocaleString()} VND`
      })

      // Bonus points for eco-friendly categories
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const product = item.product
          
          // Category-based bonus points
          let categoryBonus = 0
          switch (product.category) {
            case 'organic':
              categoryBonus = item.quantity * 5
              breakdown.push({
                action: 'organic_bonus',
                points: categoryBonus,
                description: `Organic product bonus: ${product.name} x${item.quantity}`
              })
              break
            case 'recycled':
              categoryBonus = item.quantity * 8
              breakdown.push({
                action: 'recycled_bonus',
                points: categoryBonus,
                description: `Recycled product bonus: ${product.name} x${item.quantity}`
              })
              break
            case 'sustainable':
              categoryBonus = item.quantity * 10
              breakdown.push({
                action: 'sustainable_bonus',
                points: categoryBonus,
                description: `Sustainable product bonus: ${product.name} x${item.quantity}`
              })
              break
          }
          totalPoints += categoryBonus
        }
      }

      // First purchase bonus
      const isFirstPurchase = await this.isFirstPurchase(userId)
      if (isFirstPurchase) {
        const firstPurchaseBonus = 50
        totalPoints += firstPurchaseBonus
        breakdown.push({
          action: 'first_purchase',
          points: firstPurchaseBonus,
          description: 'First purchase welcome bonus!'
        })
      }

      // Large order bonus (orders > 500,000 VND)
      if (order.totalAmount > 500000) {
        const largeOrderBonus = 25
        totalPoints += largeOrderBonus
        breakdown.push({
          action: 'large_order',
          points: largeOrderBonus,
          description: 'Large order bonus (>500K VND)'
        })
      }

      // Award the points
      const result = await GamificationService.addXp(
        userId, 
        totalPoints, 
        'purchase', 
        order._id
      )

      return {
        ...result,
        pointsBreakdown: breakdown,
        totalPointsAwarded: totalPoints
      }

    } catch (error) {
      console.error('Error awarding purchase points:', error)
      throw error
    }
  }

  /**
   * 🌱 GARDEN & FARMING ACTIONS
   */

  /**
   * Award points for planting seeds
   * @param {string} userId - User ID
   * @param {string} cropType - Type of crop planted
   * @param {number} quantity - Number of seeds planted
   */
  static async awardPlantingPoints(userId, cropType, quantity = 1) {
    const pointsPerSeed = {
      'apple': 3,
      'mango': 3,
      'tomato': 2,
      'carrot': 2,
      'strawberry': 4,
      'corn': 3,
      'pumpkin': 5,
      'sunflower': 4,
      'lettuce': 2,
      'potato': 2
    }

    const points = (pointsPerSeed[cropType] || 2) * quantity

    return await GamificationService.addXp(
      userId,
      points,
      'plant_seeds',
      `${cropType}_x${quantity}`
    )
  }

  /**
   * Award points for harvesting crops
   * @param {string} userId - User ID
   * @param {string} cropType - Type of crop harvested
   * @param {number} quantity - Number of crops harvested
   */
  static async awardHarvestPoints(userId, cropType, quantity = 1) {
    const pointsPerHarvest = {
      'apple': 5,
      'mango': 5,
      'tomato': 3,
      'carrot': 3,
      'strawberry': 6,
      'corn': 4,
      'pumpkin': 8,
      'sunflower': 6,
      'lettuce': 3,
      'potato': 3
    }

    const points = (pointsPerHarvest[cropType] || 3) * quantity

    return await GamificationService.addXp(
      userId,
      points,
      'harvest_crops',
      `${cropType}_x${quantity}`
    )
  }

  /**
   * Award points for taking care of garden (watering, fertilizing)
   * @param {string} userId - User ID
   * @param {string} action - 'water' or 'fertilize'
   * @param {number} plotsCount - Number of plots cared for
   */
  static async awardGardenCarePoints(userId, action, plotsCount = 1) {
    const pointsConfig = {
      'water': 1,
      'fertilize': 2
    }

    const points = (pointsConfig[action] || 1) * plotsCount

    return await GamificationService.addXp(
      userId,
      points,
      `garden_${action}`,
      plotsCount
    )
  }

  /**
   * 🎯 CHALLENGE & SOCIAL ACTIONS
   */

  /**
   * Award points for creating a new challenge
   * @param {string} userId - User ID
   * @param {string} challengeId - Challenge ID
   */
  static async awardCreateChallengePoints(userId, challengeId) {
    const points = 15

    return await GamificationService.addXp(
      userId,
      points,
      'create_challenge',
      challengeId
    )
  }

  /**
   * Award points for sharing content on social media
   * @param {string} userId - User ID
   * @param {string} contentType - 'product', 'challenge', 'achievement'
   * @param {string} platform - 'facebook', 'instagram', 'tiktok'
   */
  static async awardSocialSharePoints(userId, contentType, platform) {
    const points = 3

    return await GamificationService.addXp(
      userId,
      points,
      'social_share',
      `${contentType}_${platform}`
    )
  }

  /**
   * Award points for referring new users
   * @param {string} referrerId - User who made the referral
   * @param {string} newUserId - New user who joined
   */
  static async awardReferralPoints(referrerId, newUserId) {
    const points = 30

    return await GamificationService.addXp(
      referrerId,
      points,
      'referral',
      newUserId
    )
  }

  /**
   * 📝 REVIEW & FEEDBACK ACTIONS
   */

  /**
   * Award points for writing product reviews
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} rating - Rating given (1-5 stars)
   * @param {boolean} hasText - Whether review includes text
   * @param {boolean} hasPhotos - Whether review includes photos
   */
  static async awardReviewPoints(userId, productId, rating, hasText = false, hasPhotos = false) {
    let points = 5 // Base review points

    // Bonus for detailed reviews
    if (hasText) points += 5
    if (hasPhotos) points += 10
    
    // Bonus for honest reviews (not just 5 stars)
    if (rating >= 3 && rating <= 4) points += 3

    return await GamificationService.addXp(
      userId,
      points,
      'product_review',
      productId
    )
  }

  /**
   * 🏆 ACHIEVEMENT & MILESTONE BONUSES
   */

  /**
   * Award bonus points for consecutive daily logins
   * @param {string} userId - User ID
   */
  static async awardConsecutiveLoginBonus(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) return null

    // Calculate consecutive login streak
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const loginStreak = await this.calculateLoginStreak(userId)
    
    // Award bonus points based on streak
    let bonusPoints = 0
    if (loginStreak >= 7) bonusPoints = 10   // Weekly streak
    if (loginStreak >= 30) bonusPoints = 25  // Monthly streak
    if (loginStreak >= 100) bonusPoints = 50 // 100-day streak
    
    if (bonusPoints > 0) {
      return await GamificationService.addXp(
        userId,
        bonusPoints,
        'login_streak',
        loginStreak
      )
    }

    return null
  }

  /**
   * Award points for seasonal/limited time events
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {number} multiplier - Point multiplier for event
   */
  static async awardEventPoints(userId, eventType, multiplier = 1.5) {
    const basePoints = 20
    const points = Math.floor(basePoints * multiplier)

    return await GamificationService.addXp(
      userId,
      points,
      'special_event',
      eventType
    )
  }

  /**
   * 🔄 AUTOMATIC TRIGGERS
   */

  /**
   * Check and award all applicable automatic points for a user action
   * @param {string} userId - User ID
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Data related to the action
   */
  static async processAutomaticPoints(userId, actionType, actionData = {}) {
    const results = []

    try {
      switch (actionType) {
        case 'purchase_completed':
          const purchaseResult = await this.awardPurchasePoints(userId, actionData)
          results.push(purchaseResult)
          break

        case 'seed_planted':
          const plantResult = await this.awardPlantingPoints(
            userId, 
            actionData.cropType, 
            actionData.quantity
          )
          results.push(plantResult)
          break

        case 'crop_harvested':
          const harvestResult = await this.awardHarvestPoints(
            userId, 
            actionData.cropType, 
            actionData.quantity
          )
          results.push(harvestResult)
          break

        case 'garden_care':
          const careResult = await this.awardGardenCarePoints(
            userId, 
            actionData.action, 
            actionData.plotsCount
          )
          results.push(careResult)
          break

        case 'challenge_created':
          const createResult = await this.awardCreateChallengePoints(userId, actionData.challengeId)
          results.push(createResult)
          break

        case 'content_shared':
          const shareResult = await this.awardSocialSharePoints(
            userId, 
            actionData.contentType, 
            actionData.platform
          )
          results.push(shareResult)
          break

        case 'user_referred':
          const referralResult = await this.awardReferralPoints(userId, actionData.newUserId)
          results.push(referralResult)
          break

        case 'review_written':
          const reviewResult = await this.awardReviewPoints(
            userId, 
            actionData.productId, 
            actionData.rating, 
            actionData.hasText, 
            actionData.hasPhotos
          )
          results.push(reviewResult)
          break

        case 'daily_login':
          // Check for consecutive login bonus
          const loginBonusResult = await this.awardConsecutiveLoginBonus(userId)
          if (loginBonusResult) results.push(loginBonusResult)
          break

        default:
          console.warn(`Unknown action type: ${actionType}`)
      }

      return {
        success: true,
        results,
        totalPointsAwarded: results.reduce((total, result) => total + (result.xpGained || 0), 0)
      }

    } catch (error) {
      console.error('Error processing automatic points:', error)
      throw error
    }
  }

  /**
   * 🛠️ HELPER FUNCTIONS
   */

  /**
   * Check if this is user's first purchase
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  static async isFirstPurchase(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) return true

    // Check if user has any purchase-related activity
    const hasPurchase = garden.activityLog.some(log => log.action === 'purchase')
    return !hasPurchase
  }

  /**
   * Calculate consecutive login streak
   * @param {string} userId - User ID
   * @returns {number} Number of consecutive days
   */
  static async calculateLoginStreak(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden || !garden.lastDailyLoginDate) return 0

    const today = new Date()
    const lastLogin = new Date(garden.lastDailyLoginDate)
    
    // Calculate days difference
    const diffTime = Math.abs(today - lastLogin)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Check activity log for consecutive logins
    const loginLogs = garden.activityLog
      .filter(log => log.action === 'daily_login')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    let streak = 0
    let currentDate = new Date()
    
    for (const log of loginLogs) {
      const logDate = new Date(log.timestamp)
      const daysDiff = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
        currentDate = new Date(logDate)
      } else if (daysDiff > streak) {
        break
      }
    }
    
    return streak
  }

  /**
   * Get point calculation preview without awarding
   * @param {string} actionType - Type of action
   * @param {Object} actionData - Action data
   * @returns {Object} Preview of points that would be awarded
   */
  static getPointPreview(actionType, actionData = {}) {
    const preview = {
      actionType,
      estimatedPoints: 0,
      breakdown: []
    }

    switch (actionType) {
      case 'purchase_completed':
        preview.estimatedPoints = Math.floor(actionData.totalAmount / 1000)
        preview.breakdown.push({
          source: 'base_purchase',
          points: preview.estimatedPoints,
          description: 'Base purchase points'
        })
        break

      case 'seed_planted':
        const plantPoints = { apple: 3, mango: 3, tomato: 2, carrot: 2, strawberry: 4 }
        preview.estimatedPoints = (plantPoints[actionData.cropType] || 2) * (actionData.quantity || 1)
        break

      case 'crop_harvested':
        const harvestPoints = { apple: 5, mango: 5, tomato: 3, carrot: 3, strawberry: 6 }
        preview.estimatedPoints = (harvestPoints[actionData.cropType] || 3) * (actionData.quantity || 1)
        break

      // Add more preview calculations as needed
    }

    return preview
  }
}

export default AutomaticPointService