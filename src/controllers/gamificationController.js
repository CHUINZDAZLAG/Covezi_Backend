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
   * POST /plant-seed
   * Plant seed in garden
   */
  static async plantSeed(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { cropType } = req.body

      if (!cropType) {
        throw new ApiError(400, 'cropType required')
      }

      const plot = await GamificationService.plantSeed(userId, cropType)
      res.status(200).json({
        success: true,
        message: 'Seed planted!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /care-plant
   * Water or fertilize plant
   */
  static async careForPlant(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, careType } = req.body

      if (!plotId || !careType) {
        throw new ApiError(400, 'plotId and careType required')
      }

      const plot = await GamificationService.careForPlant(userId, plotId, careType)
      res.status(200).json({
        success: true,
        message: `Plant ${careType}ed!`,
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /harvest-crop
   * Harvest ready crop (stage 4)
   */
  static async harvestCrop(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId } = req.body

      if (!plotId) {
        throw new ApiError(400, 'plotId required')
      }

      const plot = await GamificationService.harvestCrop(userId, plotId)
      res.status(200).json({
        success: true,
        message: 'Crop harvested!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /customize-tree-plot
   * Customize tree plot (pot, effect)
   */
  static async customizeTreePlot(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, potType, effect } = req.body

      if (!plotId) {
        throw new ApiError(400, 'plotId required')
      }

      const plot = await GamificationService.customizeTreePlot(userId, plotId, {
        potType,
        effect
      })
      res.status(200).json({
        success: true,
        message: 'Tree customized!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /customize-tree
   * Customize master tree design
   */
  static async customizeTree(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const customization = req.body

      const garden = await gardenService.customizeTree(userId, customization)
      
      res.status(200).json({
        success: true,
        message: 'Tree customized!',
        data: garden
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /plant-tree-in-plot
   * Plant tree in garden plot
   */
  static async plantTreeInPlot(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, treeCustomization } = req.body

      if (!plotId) {
        throw new ApiError(400, 'plotId required')
      }

      const garden = await gardenService.plantTreeInPlot(userId, plotId, { treeCustomization })
      res.status(200).json({
        success: true,
        message: 'Tree planted in plot!',
        data: garden
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /garden-action
   * Perform action on tree (water/fertilize)
   */
  static async performGardenAction(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, action } = req.body

      if (!plotId || !action) {
        throw new ApiError(400, 'plotId and action required')
      }

      const result = await gardenService.performGardenAction(userId, plotId, action)
      res.status(200).json({
        success: true,
        message: `Garden action ${action} completed!`,
        data: result.garden,
        rewards: result.rewards,
        levelUp: result.levelUp
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /harvest-garden-tree
   * Harvest tree from plot
   */
  static async harvestGardenTree(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId } = req.body

      if (!plotId) {
        throw new ApiError(400, 'plotId required')
      }

      const result = await gardenService.harvestGardenTree(userId, plotId)
      res.status(200).json({
        success: true,
        message: 'Tree harvested!',
        data: result.garden,
        rewards: result.rewards
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /customize-pet
   * Customize pet (name, color, decorations)
   */
  static async customizePet(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { name, color, decorations } = req.body

      const pet = await GamificationService.customizePet(userId, {
        name,
        color,
        decorations
      })
      res.status(200).json({
        success: true,
        message: 'Pet customized!',
        data: pet
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /feed-pet
   * Feed pet (increases health)
   */
  static async feedPet(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const pet = await GamificationService.feedPet(userId)
      res.status(200).json({
        success: true,
        message: 'Pet fed!',
        data: pet
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /collect-egg
   * Collect egg from pet
   */
  static async collectEgg(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const result = await GamificationService.collectEgg(userId)
      res.status(200).json({
        success: true,
        message: 'Egg collected!',
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
   * GET /vouchers?status=active|used|expired
   * Get user's vouchers
   */
  static async getUserVouchers(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { status } = req.query

      const vouchers = await GamificationService.getUserVouchers(userId, status)
      res.status(200).json({
        success: true,
        data: vouchers
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * POST /use-voucher
   * Use voucher on order
   */
  static async useVoucher(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { voucherId, orderId } = req.body

      if (!voucherId || !orderId) {
        throw new ApiError(400, 'voucherId and orderId required')
      }

      const voucher = await GamificationService.useVoucher(userId, voucherId, orderId)
      res.status(200).json({
        success: true,
        message: 'Voucher used!',
        data: voucher
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
