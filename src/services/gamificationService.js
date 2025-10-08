import { UserGarden, GamificationConfig, Voucher } from '~/models/gamificationModel.js'
import ApiError from '~/utils/ApiError.js'

class GamificationService {
  // Get or create default config
  static async getConfig() {
    let config = await GamificationConfig.findOne()
    if (!config) {
      config = new GamificationConfig()
      await config.save()
    }
    return config
  }

  /**
   * Calculate XP required for a specific level
   * Formula: 100 * N^1.4 (where N is the level)
   * @param {number} level - The level to calculate XP for
   * @returns {number} - XP required for that level
   */
  static calculateXpRequiredForLevel(level) {
    // Level 1 = 100 * 1^1.4 = 100
    // Level 2 = 100 * 2^1.4 ≈ 265
    // Level 10 = 100 * 10^1.4 ≈ 8800
    // Level 50 = 100 * 50^1.4 ≈ 125,000
    // Level 100 = 100 * 100^1.4 ≈ 400,000
    return Math.ceil(100 * Math.pow(level, 1.4))
  }

  /**
   * Calculate cumulative XP needed from level 1 to reach a target level
   * @param {number} targetLevel - The target level
   * @returns {number} - Total cumulative XP needed
   */
  static calculateCumulativeXpForLevel(targetLevel) {
    let totalXp = 0
    for (let level = 1; level < targetLevel; level++) {
      totalXp += this.calculateXpRequiredForLevel(level)
    }
    return totalXp
  }

  /**
   * Initialize user garden (called on user creation)
   */
  static async initializeUserGarden(userId) {
    let garden = await UserGarden.findOne({ userId })
    if (!garden) {
      garden = new UserGarden({
        userId,
        level: 1,
        currentXp: 0,
        nextLevelXp: 50,
        treeStage: 1,
        chickenStage: 1,
        pet: {
          name: 'My Pet',
          stage: 1,
          bornAt: new Date(),
          color: 'brown',
          decorations: {
            hat: 'none',
            shirt: 'none',
            scarf: 'none',
            wings: 'normal'
          }
        },
        inventory: {
          eggs: 0,
          crops: {
            apple: 0,
            mango: 0,
            tomato: 0,
            carrot: 0,
            strawberry: 0,
            corn: 0,
            pumpkin: 0,
            sunflower: 0,
            lettuce: 0,
            potato: 0
          },
          seeds: {
            appleSeed: 5,
            mangoSeed: 5,
            tomatoSeed: 5,
            carrotSeed: 5,
            strawberrySeed: 3,
            cornSeed: 3,
            pumpkinSeed: 3,
            sunflowerSeed: 3,
            lettuceSeed: 5,
            potatoSeed: 5
          },
          fertilizers: 10
        }
      })
      await garden.save()
    }
    return garden
  }

  /**
   * Add XP from 3 sources:
   * 1. Join challenge: +X XP
   * 2. Complete challenge: +Y XP
   * 3. Daily login: +A XP
   * Formula-based level: 100 * N^1.4
   * Returns: { leveledUp, xpGained, oldLevel, newLevel, voucherEarned, treeStageUpgrade, landUnlock }
   */
  static async addXp(userId, xpAmount, action, reference = null) {
    const config = await this.getConfig()
    let garden = await UserGarden.findOne({ userId })

    if (!garden) {
      garden = await this.initializeUserGarden(userId)
    }

    const oldLevel = garden.level
    const oldTreeStage = garden.treeStage
    const oldLandUnlocked = garden.landUnlocked
    let voucherEarned = null
    let treeStageUpgrade = false
    let landUnlock = null

    // Add XP
    garden.currentXp += xpAmount

    // Calculate XP required for next level using formula: 100 * N^1.4
    const xpForNextLevel = this.calculateXpRequiredForLevel(garden.level + 1)
    
    // Level up logic using formula-based progression
    while (
      garden.currentXp >= xpForNextLevel &&
      garden.level < config.maxLevel
    ) {
      garden.currentXp -= xpForNextLevel
      garden.level += 1
      
      // Check if max level reached
      if (garden.level >= config.maxLevel) {
        garden.level = config.maxLevel
        garden.currentXp = 0
        break
      }
    }

    // Recalculate nextLevelXp for display
    garden.nextLevelXp = this.calculateXpRequiredForLevel(garden.level + 1)

    // Update tree stage based on level (auto-upgrade with growth stages config)
    const treeStage = config.treeGrowthStages.find(
      stage => garden.level >= stage.levelMin && garden.level <= stage.levelMax
    )
    if (treeStage && treeStage.stage !== oldTreeStage) {
      garden.treeStage = treeStage.stage
      treeStageUpgrade = true
    }

    // Update chicken stage (same intervals as before for backward compatibility)
    const stageInterval = 5
    garden.chickenStage = Math.floor((garden.level - 1) / stageInterval) + 1
    garden.chickenStage = Math.min(garden.chickenStage, 5)

    // Update land unlock based on level milestones
    const landTier = config.landUnlockTiers.find(tier => garden.level >= tier.level)
    if (landTier && landTier.unlockedPlots !== oldLandUnlocked) {
      garden.landUnlocked = landTier.unlockedPlots
      garden.landTheme = landTier.name.toLowerCase().replace(' ', '_')
      landUnlock = {
        newPlots: landTier.unlockedPlots,
        theme: landTier.name,
        description: landTier.description
      }
    }

    // Log activity
    garden.activityLog.push({
      action,
      details: `Earned ${xpAmount} XP (${action})`,
      xpEarned: xpAmount,
      timestamp: new Date()
    })

    // Check for level up and voucher milestone
    if (garden.level > oldLevel) {
      voucherEarned = await this.checkAndAwardVoucherMilestone(userId, garden, config)
    }

    await garden.save()

    return {
      xpGained: xpAmount,
      leveledUp: garden.level > oldLevel,
      oldLevel,
      newLevel: garden.level,
      currentXp: garden.currentXp,
      nextLevelXp: garden.nextLevelXp,
      treeStageUpgrade,
      treeStage: garden.treeStage,
      landUnlock,
      voucherEarned
    }
  }

  /**
   * Claim daily login reward (once per day)
   * Returns: { xpGained, newLevel, voucherEarned }
   */
  static async claimDailyLoginReward(userId) {
    const config = await this.getConfig()
    let garden = await UserGarden.findOne({ userId })

    if (!garden) {
      garden = await this.initializeUserGarden(userId)
    }

    // Check if already claimed today
    const today = new Date().toDateString()
    const lastLogin = garden.lastDailyLoginDate
      ? new Date(garden.lastDailyLoginDate).toDateString()
      : null

    if (lastLogin === today) {
      throw new ApiError(400, 'Already claimed daily login bonus today')
    }

    garden.lastDailyLoginDate = new Date()
    const dailyXp = config.pointsConfig.dailyLogin // default 5 XP

    return await this.addXp(userId, dailyXp, 'daily_login')
  }

  /**
   * Join challenge: +X XP (from config)
   */
  static async awardJoinChallengeXp(userId, challengeId) {
    const config = await this.getConfig()
    const xp = config.pointsConfig.joinChallenge // default 10

    const result = await this.addXp(
      userId,
      xp,
      'join_challenge',
      challengeId
    )

    // Track in challenge history
    let garden = await UserGarden.findOne({ userId })
    garden.challengeHistory.push({
      challengeId,
      action: 'joined',
      xpEarned: xp,
      earnedAt: new Date()
    })
    await garden.save()

    return result
  }

  /**
   * Complete challenge: +Y XP (from config)
   */
  static async awardCompleteChallengeXp(userId, challengeId) {
    const config = await this.getConfig()
    const xp = config.pointsConfig.completeChallenge // default 20

    const result = await this.addXp(
      userId,
      xp,
      'complete_challenge',
      challengeId
    )

    let garden = await UserGarden.findOne({ userId })
    const existing = garden.challengeHistory.find(
      ch => ch.challengeId.toString() === challengeId.toString()
    )
    if (existing) {
      existing.action = 'completed'
      existing.xpEarned = xp
    } else {
      garden.challengeHistory.push({
        challengeId,
        action: 'completed',
        xpEarned: xp,
        earnedAt: new Date()
      })
    }
    await garden.save()

    return result
  }

  /**
   * Creator bonus: +Z XP when challenge has >10 participants
   */
  static async awardChallengeCreatorBonusXp(creatorId, challengeId, participantCount) {
    if (participantCount <= 10) return null

    const config = await this.getConfig()
    const xp = config.pointsConfig.createChallengeAbove10 // default 30

    return await this.addXp(
      creatorId,
      xp,
      'create_challenge_above10',
      challengeId
    )
  }

  /**
   * Check if user reached voucher milestone
   * Mốc cách nhau 50: 50, 100, 150, 200, 250, ...
   * Returns: voucher data if earned, null otherwise
   */
  static async checkAndAwardVoucherMilestone(userId, garden, config = null) {
    if (!config) {
      config = await this.getConfig()
    }

    // Find milestone for exact level match
    const milestone = config.voucherMilestones.find(m => m.level === garden.level)

    if (!milestone) {
      return null // No voucher milestone at this level
    }

    // Check if already claimed this milestone
    const alreadyClaimed = garden.voucherMilestonesClaimed.some(
      claim => claim.level === garden.level
    )
    if (alreadyClaimed) {
      return null
    }

    // Create voucher
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.voucherValidityDays)

    const voucher = new Voucher({
      code: `VOUCHER_LV${garden.level}_${userId}_${Date.now()}`.toUpperCase(),
      userId,
      levelEarned: garden.level,
      discountPercent: milestone.discountPercent,
      status: 'active',
      issuedAt: new Date(),
      expiresAt
    })
    await voucher.save()

    // Track milestone
    garden.voucherMilestonesClaimed.push({
      level: garden.level,
      claimedAt: new Date(),
      discountPercent: milestone.discountPercent
    })

    garden.vouchersReceived.push(voucher._id)
    await garden.save()

    return {
      voucherId: voucher._id,
      code: voucher.code,
      discount: milestone.discountPercent,
      expiresAt,
      message: `🎉 Congratulations! You reached Level ${garden.level} and earned a ${milestone.discountPercent}% voucher!`
    }
  }

  /**
   * Get user's complete garden data
   */
  static async getUserGarden(userId) {
    let garden = await UserGarden.findOne({ userId }).populate('vouchersReceived')
    if (!garden) {
      garden = await this.initializeUserGarden(userId)
    }
    return garden
  }

  /**
   * Plant seed in garden
   */
  static async plantSeed(userId, cropType) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    const seedKey = `${cropType}Seed`
    if (!garden.inventory.seeds[seedKey] || garden.inventory.seeds[seedKey] < 1) {
      throw new ApiError(400, `Not enough ${cropType} seeds`)
    }

    // Deduct seed
    garden.inventory.seeds[seedKey] -= 1

    // Create plot
    const plotId = `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    garden.gardenPlots.push({
      id: plotId,
      cropType,
      stage: 0,
      stageProgress: 0,
      plantedAt: new Date(),
      health: 100,
      hasBeenHarvested: false,
      potType: 'ceramic',
      effect: 'none'
    })

    await garden.save()
    return garden.gardenPlots[garden.gardenPlots.length - 1]
  }

  /**
   * Water or fertilize plant
   */
  static async careForPlant(userId, plotId, careType) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    const plot = garden.gardenPlots.id(plotId) || garden.gardenPlots.find(p => p.id === plotId)
    if (!plot) {
      throw new ApiError(404, 'Garden plot not found')
    }

    if (careType === 'water') {
      plot.lastWateredAt = new Date()
      plot.stageProgress = Math.min(plot.stageProgress + 15, 100)
      plot.health = Math.min(plot.health + 5, 100)
    } else if (careType === 'fertilize') {
      if (garden.inventory.fertilizers < 1) {
        throw new ApiError(400, 'Not enough fertilizers')
      }
      garden.inventory.fertilizers -= 1
      plot.lastFertilizedAt = new Date()
      plot.stageProgress = Math.min(plot.stageProgress + 25, 100)
    } else {
      throw new ApiError(400, 'Invalid care type')
    }

    // Auto-progress stage
    if (plot.stageProgress >= 100 && plot.stage < 4) {
      plot.stage += 1
      plot.stageProgress = 0
    }

    await garden.save()
    return plot
  }

  /**
   * Harvest crop (stage 4 = ready)
   */
  static async harvestCrop(userId, plotId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    const plot = garden.gardenPlots.find(p => p.id === plotId)
    if (!plot) {
      throw new ApiError(404, 'Garden plot not found')
    }

    if (plot.stage !== 4) {
      throw new ApiError(400, 'Crop is not ready to harvest')
    }

    if (plot.hasBeenHarvested) {
      throw new ApiError(400, 'Crop has already been harvested')
    }

    plot.hasBeenHarvested = true
    plot.harvestedAt = new Date()

    // Add to inventory
    garden.inventory.crops[plot.cropType] =
      (garden.inventory.crops[plot.cropType] || 0) + 1

    await garden.save()
    return plot
  }

  /**
   * Customize tree (pot, effect)
   */
  static async customizeTreePlot(userId, plotId, customization) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    // Update global tree customization (UI display)
    garden.treeCustomization = {
      name: customization.name || garden.treeCustomization?.name || 'Cây của tôi',
      potType: customization.potType || garden.treeCustomization?.potType || 'terracotta',
      color: customization.color || garden.treeCustomization?.color || '#4caf50',
      potColor: customization.potColor || garden.treeCustomization?.potColor || '#8b4513',
      effects: customization.effects || garden.treeCustomization?.effects || []
    }

    // If plotId provided, also update specific plot customization
    if (plotId) {
      const plot = garden.gardenPlots.find(p => p.id === plotId)
      if (plot) {
        if (customization.potType) plot.potType = customization.potType
        if (customization.effect) plot.effect = customization.effect
      }
    }

    await garden.save()
    return garden.treeCustomization
  }

  /**
   * Customize pet (name, color, decorations)
   */
  static async customizePet(userId, customization) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    // Update petCustomization with UI-facing customization
    garden.petCustomization = {
      name: customization.name || garden.petCustomization?.name || 'Gà của tôi',
      style: customization.style || garden.petCustomization?.style || 'fonze',
      color: customization.color || garden.petCustomization?.color || '#ff9800',
      decorations: customization.decorations || garden.petCustomization?.decorations || []
    }

    await garden.save()
    return garden.petCustomization
  }

  /**
   * Feed pet - increases health, may trigger egg
   */
  static async feedPet(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    garden.pet.lastFedAt = new Date()
    garden.pet.health = Math.min(garden.pet.health + 20, 100)

    // Schedule next egg if adult
    if (garden.pet.stage >= 4 && !garden.pet.nextEggReadyAt) {
      const hoursUntilEgg = 24 + Math.random() * 24
      garden.pet.nextEggReadyAt = new Date(
        Date.now() + hoursUntilEgg * 60 * 60 * 1000
      )
    }

    await garden.save()
    return garden.pet
  }

  /**
   * Collect egg from pet
   */
  static async collectEgg(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    if (garden.pet.stage < 4) {
      throw new ApiError(400, 'Pet must be adult (stage 4+) to lay eggs')
    }

    if (!garden.pet.nextEggReadyAt || garden.pet.nextEggReadyAt > new Date()) {
      const hoursUntil = garden.pet.nextEggReadyAt
        ? Math.ceil((garden.pet.nextEggReadyAt - new Date()) / (60 * 60 * 1000))
        : 0
      throw new ApiError(400, `Egg not ready. Available in ${hoursUntil} hours`)
    }

    // Add egg to inventory
    garden.inventory.eggs += 1

    // Reset egg timer
    garden.pet.lastEggCollectedAt = new Date()
    const hoursUntilNextEgg = 24 + Math.random() * 24
    garden.pet.nextEggReadyAt = new Date(
      Date.now() + hoursUntilNextEgg * 60 * 60 * 1000
    )

    await garden.save()
    return { eggs: 1, nextEggReadyAt: garden.pet.nextEggReadyAt }
  }

  /**
   * Get all user vouchers (active, used, expired)
   */
  static async getUserVouchers(userId, status = null) {
    const query = { userId }
    if (status) query.status = status

    const vouchers = await Voucher.find(query).sort({ issuedAt: -1 })
    return vouchers
  }

  /**
   * Use voucher on order
   */
  static async useVoucher(userId, voucherId, orderId) {
    const voucher = await Voucher.findById(voucherId)
    if (!voucher) {
      throw new ApiError(404, 'Voucher not found')
    }

    if (voucher.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'This voucher is not yours')
    }

    if (voucher.status !== 'active') {
      throw new ApiError(400, `Voucher is ${voucher.status}`)
    }

    if (voucher.expiresAt < new Date()) {
      voucher.status = 'expired'
      await voucher.save()
      throw new ApiError(400, 'Voucher has expired')
    }

    voucher.status = 'used'
    voucher.usedAt = new Date()
    voucher.usedOnOrderId = orderId
    await voucher.save()

    return voucher
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit = 50, offset = 0) {
    const gardens = await UserGarden.find()
      .sort({ level: -1, currentXp: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'displayName avatar email')

    return gardens
  }

  /**
   * Get user rank
   */
  static async getUserRank(userId) {
    const garden = await UserGarden.findOne({ userId })
    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    const rank = await UserGarden.countDocuments({
      $or: [
        { level: { $gt: garden.level } },
        { level: garden.level, currentXp: { $gt: garden.currentXp } }
      ]
    })
    return rank + 1
  }

  /**
   * Admin: Update config
   */
  static async updateConfig(updates) {
    let config = await this.getConfig()
    Object.assign(config, updates)
    await config.save()
    return config
  }

  /**
   * Admin: Update voucher tier
   */
  static async updateVoucherTier(levelMin, levelMax, discountPercent) {
    const config = await this.getConfig()
    const tierIndex = config.voucherTiers.findIndex(
      t => t.levelMin === levelMin && t.levelMax === levelMax
    )

    if (tierIndex >= 0) {
      config.voucherTiers[tierIndex].discountPercent = discountPercent
    } else {
      config.voucherTiers.push({
        levelMin,
        levelMax,
        discountPercent,
        description: `${discountPercent}% discount (${levelMin}-${levelMax})`
      })
    }

    config.voucherTiers.sort((a, b) => a.levelMin - b.levelMin)
    await config.save()
    return config
  }

  // ===== NEW VOUCHER MILESTONE MANAGEMENT =====

  /**
   * Add new voucher milestone at specific level
   */
  static async addVoucherMilestone(level, discountPercent, description) {
    const config = await this.getConfig()

    // Check if milestone already exists
    const exists = config.voucherMilestones.some(m => m.level === level)
    if (exists) {
      throw new ApiError(400, `Voucher milestone at level ${level} already exists`)
    }

    config.voucherMilestones.push({
      level,
      discountPercent,
      description,
      isDefault: false
    })

    config.voucherMilestones.sort((a, b) => a.level - b.level)
    await config.save()
    return config
  }

  /**
   * Update existing voucher milestone
   */
  static async updateVoucherMilestone(level, discountPercent, description) {
    const config = await this.getConfig()
    const index = config.voucherMilestones.findIndex(m => m.level === level)

    if (index < 0) {
      throw new ApiError(404, `Voucher milestone at level ${level} not found`)
    }

    config.voucherMilestones[index].discountPercent = discountPercent
    if (description) {
      config.voucherMilestones[index].description = description
    }

    await config.save()
    return config
  }

  /**
   * Delete voucher milestone
   */
  static async deleteVoucherMilestone(level) {
    const config = await this.getConfig()
    const index = config.voucherMilestones.findIndex(m => m.level === level)

    if (index < 0) {
      throw new ApiError(404, `Voucher milestone at level ${level} not found`)
    }

    config.voucherMilestones.splice(index, 1)
    await config.save()
    return config
  }

  // ===== TREE GROWTH STAGES & LAND UNLOCK MANAGEMENT =====

  /**
   * Update tree growth stages configuration
   */
  static async updateTreeGrowthStages(stages) {
    const config = await this.getConfig()

    // Validate stages
    if (!Array.isArray(stages) || stages.length === 0) {
      throw new ApiError(400, 'stages must be non-empty array')
    }

    config.treeGrowthStages = stages
    config.treeGrowthStages.sort((a, b) => a.levelMin - b.levelMin)
    await config.save()
    return config
  }

  /**
   * Update land unlock tiers configuration
   */
  static async updateLandUnlockTiers(tiers) {
    const config = await this.getConfig()

    // Validate tiers
    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new ApiError(400, 'tiers must be non-empty array')
    }

    config.landUnlockTiers = tiers
    config.landUnlockTiers.sort((a, b) => a.level - b.level)
    await config.save()
    return config
  }
}

export default GamificationService
