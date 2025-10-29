import GamificationService from '~/services/gamificationService.js'
import { gardenService } from '~/services/gardenService.js'
import ApiError from '~/utils/ApiError.js'

class GamificationController {
  /**
   * GET /user-garden
   * Get user's complete garden (level, XP, pet, crops, inventory, vouchers)
   */
  static async getUserGarden(req, res) {
    try {
      if (!req.jwtDecoded || !req.jwtDecoded._id) {
        throw new ApiError(401, 'Unauthorized - Missing or invalid JWT token')
      }
      const userId = req.jwtDecoded._id
      const garden = await GamificationService.getUserGarden(userId)
      res.status(200).json({
        success: true,
        data: garden
      })
    } catch (error) {
      console.error('[getUserGarden] Error:', error.message, error.stack)
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /daily-login
   * Claim daily login reward (+5 XP)
   */
  static async claimDailyLoginReward(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const result = await GamificationService.claimDailyLoginReward(userId)
      res.status(200).json({
        success: true,
        message: 'Daily login reward claimed!',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /join-challenge
   * Award XP for joining challenge (+10 XP)
   */
  static async joinChallenge(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { challengeId } = req.body

      if (!challengeId) {
        throw new ApiError(400, 'challengeId required')
      }

      const result = await GamificationService.awardJoinChallengeXp(userId, challengeId)
      res.status(200).json({
        success: true,
        message: 'Challenge joined! XP awarded.',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /complete-challenge
   * Award XP for completing challenge (+20 XP)
   */
  static async completeChallenge(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { challengeId } = req.body

      if (!challengeId) {
        throw new ApiError(400, 'challengeId required')
      }

      const result = await GamificationService.awardCompleteChallengeXp(
        userId,
        challengeId
      )
      res.status(200).json({
        success: true,
        message: 'Challenge completed! XP awarded.',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /creator-bonus
   * Award creator bonus XP when challenge has >10 participants (+30 XP)
   */
  static async awardCreatorBonus(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { challengeId, participantCount } = req.body

      if (!challengeId || participantCount === undefined) {
        throw new ApiError(400, 'challengeId and participantCount required')
      }

      const result = await GamificationService.awardChallengeCreatorBonusXp(
        userId,
        challengeId,
        participantCount
      )

      if (!result) {
        return res.status(200).json({
          success: true,
          message: 'Participant count not yet >10',
          data: null
        })
      }

      res.status(200).json({
        success: true,
        message: 'Creator bonus awarded!',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }



























  /**
   * GET /leaderboard?limit=50&offset=0
   * Get gamification leaderboard
   */
  static async getLeaderboard(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query
      const gardens = await GamificationService.getLeaderboard(
        parseInt(limit),
        parseInt(offset)
      )
      res.status(200).json({
        success: true,
        data: gardens
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * GET /user-rank
   * Get user's rank
   */
  static async getUserRank(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const rank = await GamificationService.getUserRank(userId)
      res.status(200).json({
        success: true,
        data: { rank }
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * GET /admin/config
   * Get gamification config
   */
  static async getConfig(req, res) {
    try {
      const config = await GamificationService.getConfig()
      res.status(200).json({
        success: true,
        data: config
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * PUT /admin/config
   * Update gamification config
   */
  static async updateConfig(req, res) {
    try {
      const updates = req.body
      const config = await GamificationService.updateConfig(updates)
      res.status(200).json({
        success: true,
        message: 'Config updated!',
        data: config
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * PUT /admin/voucher-tier
   * Update voucher tier discount
   */
  static async updateVoucherTier(req, res) {
    try {
      const { levelMin, levelMax, discountPercent } = req.body

      if (levelMin === undefined || levelMax === undefined || discountPercent === undefined) {
        throw new ApiError(400, 'levelMin, levelMax, and discountPercent required')
      }

      const config = await GamificationService.updateVoucherTier(
        levelMin,
        levelMax,
        discountPercent
      )
      res.status(200).json({
        success: true,
        message: 'Voucher tier updated!',
        data: config
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // ===== NEW ADMIN ENDPOINTS FOR VOUCHER MILESTONES =====

  /**
   * GET /admin/voucher-milestones
   * Get all voucher milestones (admin view)
   */
  static async getVoucherMilestones(req, res) {
    try {
      const config = await GamificationService.getConfig()
      res.status(200).json({
        success: true,
        data: config.voucherMilestones
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /admin/voucher-milestones
   * Add new voucher milestone
   * Body: { level, discountPercent, description }
   */
  static async addVoucherMilestone(req, res) {
    try {
      const { level, discountPercent, description } = req.body

      if (level === undefined || discountPercent === undefined) {
        throw new ApiError(400, 'level and discountPercent required')
      }

      const config = await GamificationService.addVoucherMilestone(
        level,
        discountPercent,
        description || `Level ${level}: ${discountPercent}% voucher`
      )
      res.status(201).json({
        success: true,
        message: 'Voucher milestone added!',
        data: config.voucherMilestones
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * PUT /admin/voucher-milestones/:level
   * Update existing voucher milestone
   * Body: { discountPercent, description }
   */
  static async updateVoucherMilestone(req, res) {
    try {
      const { level } = req.params
      const { discountPercent, description } = req.body

      if (!level || discountPercent === undefined) {
        throw new ApiError(400, 'level and discountPercent required')
      }

      const config = await GamificationService.updateVoucherMilestone(
        parseInt(level),
        discountPercent,
        description
      )
      res.status(200).json({
        success: true,
        message: 'Voucher milestone updated!',
        data: config.voucherMilestones
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * DELETE /admin/voucher-milestones/:level
   * Delete voucher milestone
   */
  static async deleteVoucherMilestone(req, res) {
    try {
      const { level } = req.params

      if (!level) {
        throw new ApiError(400, 'level required')
      }

      const config = await GamificationService.deleteVoucherMilestone(parseInt(level))
      res.status(200).json({
        success: true,
        message: 'Voucher milestone deleted!',
        data: config.voucherMilestones
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // ===== TREE GROWTH STAGES & LAND UNLOCK MANAGEMENT =====

  /**
   * GET /admin/tree-stages
   * Get tree growth stages config
   */
  static async getTreeGrowthStages(req, res) {
    try {
      const config = await GamificationService.getConfig()
      res.status(200).json({
        success: true,
        data: config.treeGrowthStages
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * PUT /admin/tree-stages
   * Update tree growth stages config (replace all)
   * Body: [{ stage, levelMin, levelMax, name, description }]
   */
  static async updateTreeGrowthStages(req, res) {
    try {
      const stages = req.body

      if (!Array.isArray(stages)) {
        throw new ApiError(400, 'stages must be an array')
      }

      const config = await GamificationService.updateTreeGrowthStages(stages)
      res.status(200).json({
        success: true,
        message: 'Tree growth stages updated!',
        data: config.treeGrowthStages
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * GET /admin/land-tiers
   * Get land unlock tiers config
   */
  static async getLandUnlockTiers(req, res) {
    try {
      const config = await GamificationService.getConfig()
      res.status(200).json({
        success: true,
        data: config.landUnlockTiers
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * PUT /admin/land-tiers
   * Update land unlock tiers config (replace all)
   * Body: [{ level, unlockedPlots, name, description }]
   */
  static async updateLandUnlockTiers(req, res) {
    try {
      const tiers = req.body

      if (!Array.isArray(tiers)) {
        throw new ApiError(400, 'tiers must be an array')
      }

      const config = await GamificationService.updateLandUnlockTiers(tiers)
      res.status(200).json({
        success: true,
        message: 'Land unlock tiers updated!',
        data: config.landUnlockTiers
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }
}

export default GamificationController
