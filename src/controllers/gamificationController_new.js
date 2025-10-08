import GamificationService from '~/services/gamificationService.js'
import XpService from '~/services/xpService.js'
import { Voucher, UserGameStats, GardenPlot, Chicken } from '~/models/gamificationModel.js'
import ApiError from '~/utils/ApiError.js'

class GamificationController {
  // Get user game stats
  static async getUserStats(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const stats = await GamificationService.getUserGameStats(userId)
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Claim daily login bonus
  static async claimDailyLogin(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const result = await GamificationService.claimDailyLoginPoints(userId)
      res.status(200).json({
        success: true,
        message: 'Daily login bonus claimed!',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Join challenge
  static async joinChallenge(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { challengeId } = req.body
      if (!challengeId) {
        throw new ApiError(400, 'Challenge ID required')
      }
      const result = await GamificationService.awardJoinChallengePoints(userId, challengeId)
      res.status(200).json({
        success: true,
        message: 'Challenge joined! Points awarded.',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Get user farm data
  static async getFarmData(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const farmData = await GamificationService.getUserFarmData(userId)
      res.status(200).json({
        success: true,
        data: farmData
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Plant seed in garden
  static async plantSeed(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { cropType } = req.body
      if (!cropType) {
        throw new ApiError(400, 'Crop type required')
      }
      const plot = await GamificationService.plantSeed(userId, cropType)
      res.status(201).json({
        success: true,
        message: 'Seed planted successfully!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Care for plant (water or fertilize)
  static async careForPlant(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, careType } = req.body
      if (!plotId || !careType) {
        throw new ApiError(400, 'Plot ID and care type required')
      }
      const plot = await GamificationService.careForPlant(userId, plotId, careType)
      res.status(200).json({
        success: true,
        message: `Plant ${careType}ed successfully!`,
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Harvest crop
  static async harvestCrop(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId } = req.body
      if (!plotId) {
        throw new ApiError(400, 'Plot ID required')
      }
      const plot = await GamificationService.harvestCrop(userId, plotId)
      res.status(200).json({
        success: true,
        message: 'Crop harvested successfully!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Get user pet
  static async getPet(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const pet = await GamificationService.initializePet(userId)
      res.status(200).json({
        success: true,
        data: pet
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Customize pet
  static async customizePet(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { name, color, decorations } = req.body
      const customization = {}
      if (name) customization.name = name
      if (color) customization.color = color
      if (decorations) customization.decorations = decorations

      const pet = await GamificationService.customizePet(userId, customization)
      res.status(200).json({
        success: true,
        message: 'Pet customized successfully!',
        data: pet
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Feed pet
  static async feedPet(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const pet = await GamificationService.feedPet(userId)
      res.status(200).json({
        success: true,
        message: 'Pet fed successfully!',
        data: pet
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Collect egg from pet
  static async collectEgg(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const result = await GamificationService.collectEgg(userId)
      res.status(200).json({
        success: true,
        message: 'Egg collected successfully!',
        data: result
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Customize garden plot
  static async customizeGardenPlot(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { plotId, potType, effect } = req.body
      if (!plotId) {
        throw new ApiError(400, 'Plot ID required')
      }
      const customization = {}
      if (potType) customization.potType = potType
      if (effect) customization.effect = effect

      const plot = await GamificationService.customizeGardenPlot(userId, plotId, customization)
      res.status(200).json({
        success: true,
        message: 'Garden plot customized successfully!',
        data: plot
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Get user vouchers
  static async getUserVouchers(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { status = 'active' } = req.query
      const vouchers = await GamificationService.getUserVouchers(userId, status)
      res.status(200).json({
        success: true,
        data: vouchers,
        total: vouchers.length
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Use voucher
  static async useVoucher(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const { voucherId, orderId } = req.body
      if (!voucherId || !orderId) {
        throw new ApiError(400, 'Voucher ID and Order ID required')
      }
      const voucher = await GamificationService.useVoucher(userId, voucherId, orderId)
      res.status(200).json({
        success: true,
        message: 'Voucher applied successfully!',
        data: voucher
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Get leaderboard
  static async getLeaderboard(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query
      const leaderboard = await GamificationService.getLeaderboard(parseInt(limit), parseInt(offset))
      res.status(200).json({
        success: true,
        data: leaderboard,
        total: leaderboard.length
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // Get user rank
  static async getUserRank(req, res) {
    try {
      const userId = req.jwtDecoded._id
      const rank = await GamificationService.getUserRank(userId)
      const stats = await UserGameStats.findOne({ userId }).populate('userId', 'displayName avatar')
      res.status(200).json({
        success: true,
        data: {
          rank,
          stats
        }
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // ADMIN: Get gamification config
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

  // ADMIN: Update gamification config
  static async updateConfig(req, res) {
    try {
      const updates = req.body
      const config = await GamificationService.updateConfig(updates)
      res.status(200).json({
        success: true,
        message: 'Config updated successfully!',
        data: config
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      })
    }
  }

  // ADMIN: Manage voucher milestone
  static async manageVoucherMilestone(req, res) {
    try {
      const { level, discountPercent, quantity, isActive } = req.body
      if (!level || !discountPercent) {
        throw new ApiError(400, 'Level and discount percent required')
      }
      const config = await GamificationService.manageVoucherMilestone(level, discountPercent, quantity, isActive)
      res.status(200).json({
        success: true,
        message: 'Voucher milestone updated!',
        data: config
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
