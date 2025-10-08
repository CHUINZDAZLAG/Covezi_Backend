import { gardenModel } from '~/models/gardenModel'
import { UserGarden } from '~/models/gamificationModel.js'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Helper function to safely update garden
const updateGarden = async (garden, updateData) => {
  const gardenId = garden._id?.toString ? garden._id.toString() : garden._id
  return gardenModel.update(gardenId, updateData)
}

const getOrCreateGarden = async (userId) => {
  try {
    // Check if user already has a garden
    let garden = await gardenModel.findByUserId(userId)
    
    if (!garden) {
      // Create new garden for user
      const newGarden = {
        userId: userId,
        level: 1,
        experience: 0,
        coins: 100, // Starting coins
        trees: [],
        inventory: {
          seeds: [
            { type: 'oak', quantity: 2 },
            { type: 'pine', quantity: 1 }
          ],
          tools: [
            { type: 'watering-can', quantity: 1, uses: 10 },
            { type: 'fertilizer', quantity: 3 }
          ],
          decorations: []
        },
        achievements: [],
        lastWatered: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      const createdGarden = await gardenModel.createNew(newGarden)
      garden = await gardenModel.findByUserId(userId)
    }
    
    return garden
  } catch (error) {
    throw error
  }
}

const getGardenDetails = async (userId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Calculate trees that need attention
    const now = Date.now()
    const treesNeedingWater = garden.trees.filter(tree => {
      const hoursSinceWatered = (now - tree.lastWatered) / (1000 * 60 * 60)
      return hoursSinceWatered > 24 // Need water every 24 hours
    })
    
    const treesReadyToHarvest = garden.trees.filter(tree => 
      tree.stage === 'mature' && !tree.harvested
    )
    
    return {
      ...garden,
      statistics: {
        totalTrees: garden.trees.length,
        matureTrees: garden.trees.filter(t => t.stage === 'mature').length,
        treesNeedingWater: treesNeedingWater.length,
        treesReadyToHarvest: treesReadyToHarvest.length,
        totalCoinsEarned: garden.trees.reduce((sum, tree) => sum + (tree.coinsEarned || 0), 0),
        gardenHealth: calculateGardenHealth(garden)
      }
    }
  } catch (error) {
    throw error
  }
}

const plantTree = async (userId, treeType, position) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Check if user has seed in inventory
    const seedIndex = garden.inventory.seeds.findIndex(seed => 
      seed.type === treeType && seed.quantity > 0
    )
    
    if (seedIndex === -1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No seeds available for this tree type!')
    }
    
    // Check if position is valid and not occupied
    if (position.x < 0 || position.x >= 10 || position.y < 0 || position.y >= 10) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid position!')
    }
    
    const positionOccupied = garden.trees.some(tree => 
      tree.position.x === position.x && tree.position.y === position.y
    )
    
    if (positionOccupied) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Position already occupied!')
    }
    
    const newTree = {
      id: Date.now().toString(),
      type: treeType,
      position: position,
      stage: 'seed',
      health: 100,
      plantedAt: Date.now(),
      lastWatered: Date.now(),
      lastFertilized: null,
      growth: 0,
      harvested: false,
      coinsEarned: 0
    }
    
    // Update garden
    const updateData = {
      $push: { trees: newTree },
      $inc: { 
        experience: 10, // XP for planting
        [`inventory.seeds.${seedIndex}.quantity`]: -1
      },
      updatedAt: Date.now()
    }
    
    // Remove seed if quantity reaches 0
    if (garden.inventory.seeds[seedIndex].quantity === 1) {
      updateData.$pull = { 'inventory.seeds': { type: treeType, quantity: 0 } }
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    
    // Check for level up
    await checkLevelUp(garden._id, garden.experience + 10)
    
    return updatedGarden
  } catch (error) {
    throw error
  }
}

const waterTree = async (userId, treeId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Check if user has watering can
    const wateringCanIndex = garden.inventory.tools.findIndex(tool => 
      tool.type === 'watering-can' && tool.uses > 0
    )
    
    if (wateringCanIndex === -1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No watering can available!')
    }
    
    const treeIndex = garden.trees.findIndex(tree => tree.id === treeId)
    if (treeIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Tree not found!')
    }
    
    const tree = garden.trees[treeIndex]
    const now = Date.now()
    const hoursSinceWatered = (now - tree.lastWatered) / (1000 * 60 * 60)
    
    if (hoursSinceWatered < 6) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tree was watered recently!')
    }
    
    // Calculate growth increase
    const growthIncrease = Math.min(25, 100 - tree.growth)
    const healthIncrease = Math.min(10, 100 - tree.health)
    
    const updateData = {
      [`trees.${treeIndex}.lastWatered`]: now,
      [`trees.${treeIndex}.growth`]: tree.growth + growthIncrease,
      [`trees.${treeIndex}.health`]: Math.min(100, tree.health + healthIncrease),
      [`inventory.tools.${wateringCanIndex}.uses`]: garden.inventory.tools[wateringCanIndex].uses - 1,
      $inc: { experience: 5 },
      updatedAt: now
    }
    
    // Update tree stage based on growth
    const newGrowth = tree.growth + growthIncrease
    if (newGrowth >= 100 && tree.stage !== 'mature') {
      updateData[`trees.${treeIndex}.stage`] = 'mature'
      updateData.$inc.experience += 15 // Bonus XP for mature tree
    } else if (newGrowth >= 75 && tree.stage === 'seed') {
      updateData[`trees.${treeIndex}.stage`] = 'sapling'
    } else if (newGrowth >= 50 && tree.stage === 'sapling') {
      updateData[`trees.${treeIndex}.stage`] = 'young'
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    
    // Check for level up and achievements
    await checkLevelUp(garden._id, garden.experience + 5)
    await checkAchievements(garden._id, 'water', { treeCount: garden.trees.length })
    
    return updatedGarden
  } catch (error) {
    throw error
  }
}

const fertilizeTree = async (userId, treeId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Check if user has fertilizer
    const fertilizerIndex = garden.inventory.tools.findIndex(tool => 
      tool.type === 'fertilizer' && tool.quantity > 0
    )
    
    if (fertilizerIndex === -1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No fertilizer available!')
    }
    
    const treeIndex = garden.trees.findIndex(tree => tree.id === treeId)
    if (treeIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Tree not found!')
    }
    
    const tree = garden.trees[treeIndex]
    const now = Date.now()
    
    // Check if recently fertilized
    if (tree.lastFertilized && (now - tree.lastFertilized) < 24 * 60 * 60 * 1000) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tree was fertilized recently!')
    }
    
    // Calculate growth boost
    const growthBoost = Math.min(50, 100 - tree.growth)
    const healthBoost = Math.min(20, 100 - tree.health)
    
    const updateData = {
      [`trees.${treeIndex}.lastFertilized`]: now,
      [`trees.${treeIndex}.growth`]: tree.growth + growthBoost,
      [`trees.${treeIndex}.health`]: Math.min(100, tree.health + healthBoost),
      [`inventory.tools.${fertilizerIndex}.quantity`]: garden.inventory.tools[fertilizerIndex].quantity - 1,
      $inc: { experience: 10 },
      updatedAt: now
    }
    
    // Update tree stage
    const newGrowth = tree.growth + growthBoost
    if (newGrowth >= 100 && tree.stage !== 'mature') {
      updateData[`trees.${treeIndex}.stage`] = 'mature'
      updateData.$inc.experience += 20
    } else if (newGrowth >= 75 && tree.stage !== 'young' && tree.stage !== 'mature') {
      updateData[`trees.${treeIndex}.stage`] = 'young'
    } else if (newGrowth >= 50 && tree.stage === 'seed') {
      updateData[`trees.${treeIndex}.stage`] = 'sapling'
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    
    await checkLevelUp(garden._id, garden.experience + 10)
    await checkAchievements(garden._id, 'fertilize', { treeCount: garden.trees.length })
    
    return updatedGarden
  } catch (error) {
    throw error
  }
}

const harvestTree = async (userId, treeId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    const treeIndex = garden.trees.findIndex(tree => tree.id === treeId)
    if (treeIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Tree not found!')
    }
    
    const tree = garden.trees[treeIndex]
    
    if (tree.stage !== 'mature') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tree is not ready for harvest!')
    }
    
    if (tree.harvested) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tree already harvested!')
    }
    
    // Calculate rewards based on tree type and health
    const baseReward = getTreeReward(tree.type)
    const healthMultiplier = tree.health / 100
    const coinsEarned = Math.floor(baseReward.coins * healthMultiplier)
    const experienceEarned = Math.floor(baseReward.experience * healthMultiplier)
    
    const updateData = {
      [`trees.${treeIndex}.harvested`]: true,
      [`trees.${treeIndex}.harvestedAt`]: Date.now(),
      [`trees.${treeIndex}.coinsEarned`]: coinsEarned,
      $inc: { 
        coins: coinsEarned,
        experience: experienceEarned
      },
      updatedAt: Date.now()
    }
    
    // Add rewards to inventory if applicable
    if (baseReward.seeds) {
      const existingSeedIndex = garden.inventory.seeds.findIndex(seed => 
        seed.type === baseReward.seeds.type
      )
      
      if (existingSeedIndex >= 0) {
        updateData[`inventory.seeds.${existingSeedIndex}.quantity`] = 
          garden.inventory.seeds[existingSeedIndex].quantity + baseReward.seeds.quantity
      } else {
        updateData.$push = { 
          'inventory.seeds': {
            type: baseReward.seeds.type,
            quantity: baseReward.seeds.quantity
          }
        }
      }
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    
    await checkLevelUp(garden._id, garden.experience + experienceEarned)
    await checkAchievements(garden._id, 'harvest', { 
      treeType: tree.type,
      coinsEarned: coinsEarned
    })
    
    return {
      garden: updatedGarden,
      rewards: {
        coins: coinsEarned,
        experience: experienceEarned,
        seeds: baseReward.seeds
      }
    }
  } catch (error) {
    throw error
  }
}

const buyItem = async (userId, itemType, itemData) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    const prices = {
      'oak-seed': 50,
      'pine-seed': 75,
      'maple-seed': 100,
      'watering-can': 200,
      'fertilizer': 30,
      'decoration-fountain': 500,
      'decoration-bench': 300
    }
    
    const itemKey = `${itemData.type}-${itemType}`
    const price = prices[itemKey] || prices[itemType]
    
    if (!price) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Item not available!')
    }
    
    if (garden.coins < price) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient coins!')
    }
    
    let updateData = {
      $inc: { coins: -price },
      updatedAt: Date.now()
    }
    
    // Add item to inventory
    if (itemType === 'seed') {
      const existingSeedIndex = garden.inventory.seeds.findIndex(seed => 
        seed.type === itemData.type
      )
      
      if (existingSeedIndex >= 0) {
        updateData[`inventory.seeds.${existingSeedIndex}.quantity`] = 
          garden.inventory.seeds[existingSeedIndex].quantity + 1
      } else {
        updateData.$push = { 
          'inventory.seeds': {
            type: itemData.type,
            quantity: 1
          }
        }
      }
    } else if (itemType === 'tool') {
      if (itemData.type === 'watering-can') {
        updateData.$push = { 
          'inventory.tools': {
            type: 'watering-can',
            uses: 10
          }
        }
      } else if (itemData.type === 'fertilizer') {
        const existingFertilizerIndex = garden.inventory.tools.findIndex(tool => 
          tool.type === 'fertilizer'
        )
        
        if (existingFertilizerIndex >= 0) {
          updateData[`inventory.tools.${existingFertilizerIndex}.quantity`] = 
            garden.inventory.tools[existingFertilizerIndex].quantity + 1
        } else {
          updateData.$push = { 
            'inventory.tools': {
              type: 'fertilizer',
              quantity: 1
            }
          }
        }
      }
    } else if (itemType === 'decoration') {
      updateData.$push = { 
        'inventory.decorations': {
          type: itemData.type,
          id: Date.now().toString(),
          placed: false
        }
      }
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    
    await checkAchievements(garden._id, 'purchase', { itemType: itemType })
    
    return updatedGarden
  } catch (error) {
    throw error
  }
}

const placeDecoration = async (userId, decorationId, position) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    const decorationIndex = garden.inventory.decorations.findIndex(decoration => 
      decoration.id === decorationId && !decoration.placed
    )
    
    if (decorationIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Decoration not found or already placed!')
    }
    
    // Check if position is valid
    if (position.x < 0 || position.x >= 10 || position.y < 0 || position.y >= 10) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid position!')
    }
    
    const updateData = {
      [`inventory.decorations.${decorationIndex}.placed`]: true,
      [`inventory.decorations.${decorationIndex}.position`]: position,
      updatedAt: Date.now()
    }
    
    const updatedGarden = await gardenModel.update(garden._id, updateData)
    return updatedGarden
  } catch (error) {
    throw error
  }
}

// Helper functions
const calculateGardenHealth = (garden) => {
  if (garden.trees.length === 0) return 100
  
  const totalHealth = garden.trees.reduce((sum, tree) => sum + tree.health, 0)
  return Math.round(totalHealth / garden.trees.length)
}

const getTreeReward = (treeType) => {
  const rewards = {
    'oak': { coins: 100, experience: 20, seeds: { type: 'oak', quantity: 2 } },
    'pine': { coins: 150, experience: 25, seeds: { type: 'pine', quantity: 1 } },
    'maple': { coins: 200, experience: 30, seeds: { type: 'maple', quantity: 1 } }
  }
  
  return rewards[treeType] || { coins: 50, experience: 10 }
}

const checkLevelUp = async (gardenId, newExperience) => {
  try {
    const experienceThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
    let newLevel = 1
    
    for (let i = experienceThresholds.length - 1; i >= 0; i--) {
      if (newExperience >= experienceThresholds[i]) {
        newLevel = i + 1
        break
      }
    }
    
    const currentGarden = await gardenModel.findOneById(gardenId)
    
    if (newLevel > currentGarden.level) {
      // Level up rewards
      const coinsReward = newLevel * 50
      const updateData = {
        level: newLevel,
        $inc: { coins: coinsReward },
        updatedAt: Date.now()
      }
      
      await gardenModel.update(gardenId, updateData)
      await checkAchievements(gardenId, 'levelUp', { newLevel })
    }
  } catch (error) {
    console.error('Error checking level up:', error)
  }
}

const checkAchievements = async (gardenId, actionType, data) => {
  try {
    const garden = await gardenModel.findOneById(gardenId)
    const achievements = []
    
    // Define achievement criteria
    const achievementCriteria = {
      'first_plant': { action: 'plant', condition: () => garden.trees.length >= 1 },
      'green_thumb': { action: 'water', condition: () => garden.trees.length >= 10 },
      'gardener': { action: 'harvest', condition: () => garden.trees.filter(t => t.harvested).length >= 5 },
      'rich_gardener': { action: 'harvest', condition: () => garden.coins >= 1000 },
      'level_master': { action: 'levelUp', condition: () => data.newLevel >= 10 }
    }
    
    // Check for new achievements
    Object.keys(achievementCriteria).forEach(achievementKey => {
      const criteria = achievementCriteria[achievementKey]
      const hasAchievement = garden.achievements.some(a => a.type === achievementKey)
      
      if (!hasAchievement && criteria.condition()) {
        achievements.push({
          type: achievementKey,
          earnedAt: Date.now(),
          title: getAchievementTitle(achievementKey),
          description: getAchievementDescription(achievementKey)
        })
      }
    })
    
    // Save new achievements
    if (achievements.length > 0) {
      await gardenModel.update(gardenId, {
        $push: { achievements: { $each: achievements } },
        updatedAt: Date.now()
      })
    }
    
    return achievements
  } catch (error) {
    console.error('Error checking achievements:', error)
    return []
  }
}

const getAchievementTitle = (type) => {
  const titles = {
    'first_plant': 'Người trồng cây đầu tiên',
    'green_thumb': 'Bàn tay vàng',
    'gardener': 'Thợ làm vườn',
    'rich_gardener': 'Triệu phú xanh',
    'level_master': 'Bậc thầy vườn tược'
  }
  return titles[type] || 'Thành tựu mới'
}

const getAchievementDescription = (type) => {
  const descriptions = {
    'first_plant': 'Trồng cây đầu tiên trong vườn',
    'green_thumb': 'Chăm sóc 10 cây xanh',
    'gardener': 'Thu hoạch 5 cây thành công',
    'rich_gardener': 'Tích lũy được 1000 xu',
    'level_master': 'Đạt cấp độ 10'
  }
  return descriptions[type] || 'Hoàn thành thành tựu đặc biệt'
}

// Get available vouchers based on user's garden level
const getAvailableVouchers = async (userId) => {
  try {
    const garden = await getOrCreateGarden(userId)

    // Define vouchers that unlock at each level
    const allVouchers = [
      {
        _id: 'voucher_level_1',
        name: 'Giảm 5% đơn hàng',
        description: 'Áp dụng cho tất cả sản phẩm xanh',
        discount: 5,
        minOrder: 100000,
        maxDiscount: 50000,
        requiredLevel: 1,
        claimed: false
      },
      {
        _id: 'voucher_level_3',
        name: 'Giảm 10% đơn hàng',
        description: 'Áp dụng cho đơn hàng từ 200K',
        discount: 10,
        minOrder: 200000,
        maxDiscount: 100000,
        requiredLevel: 3,
        claimed: false
      },
      {
        _id: 'voucher_level_5',
        name: 'Giảm 15% đơn hàng',
        description: 'Ưu đãi đặc biệt cho thành viên tích cực',
        discount: 15,
        minOrder: 300000,
        maxDiscount: 200000,
        requiredLevel: 5,
        claimed: false
      },
      {
        _id: 'voucher_level_7',
        name: 'Giảm 20% đơn hàng',
        description: 'Voucher VIP cho người chơi chăm chỉ',
        discount: 20,
        minOrder: 400000,
        maxDiscount: 300000,
        requiredLevel: 7,
        claimed: false
      },
      {
        _id: 'voucher_level_10',
        name: 'Giảm 25% đơn hàng',
        description: 'Ưu đãi cao cấp cho bậc thầy vườn tược',
        discount: 25,
        minOrder: 500000,
        maxDiscount: 500000,
        requiredLevel: 10,
        claimed: false
      },
      {
        _id: 'voucher_level_15',
        name: 'Giảm 30% + Freeship',
        description: 'Voucher đỉnh cao cho người chơi lâu năm',
        discount: 30,
        minOrder: 300000,
        maxDiscount: 1000000,
        requiredLevel: 15,
        claimed: false
      }
    ]

    // Check which vouchers user has already claimed
    const claimedVoucherIds = garden.claimedVouchers || []

    return allVouchers.map(voucher => ({
      ...voucher,
      claimed: claimedVoucherIds.includes(voucher._id),
      canClaim: garden.level >= voucher.requiredLevel && !claimedVoucherIds.includes(voucher._id)
    }))
  } catch (error) {
    throw error
  }
}

// Claim a voucher
const claimVoucher = async (userId, voucherId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    const vouchers = await getAvailableVouchers(userId)
    const voucher = vouchers.find(v => v._id === voucherId)

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Voucher không tồn tại!')
    }

    if (voucher.claimed) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Bạn đã nhận voucher này rồi!')
    }

    if (garden.level < voucher.requiredLevel) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Cần đạt Level ${voucher.requiredLevel} để nhận voucher này!`)
    }

    // Add voucher to claimed list
    const updateData = {
      $push: { claimedVouchers: voucherId },
      updatedAt: Date.now()
    }

    await gardenModel.update(garden._id, updateData)

    return {
      success: true,
      message: 'Nhận voucher thành công!',
      voucher: { ...voucher, claimed: true }
    }
  } catch (error) {
    throw error
  }
}

// Initialize garden plots (12 empty plots in 3x4 grid)
const initializeGardenPlots = async (userId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // If plots already exist, return existing garden
    if (garden.gardenPlots && garden.gardenPlots.length > 0) {
      return garden
    }
    
    // Create 3x4 grid of empty plots
    const plots = []
    const GRID_ROWS = 3
    const GRID_COLS = 4
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        plots.push({
          plotId: `plot_${row}_${col}`,
          position: { row, col },
          treeId: null,
          treeName: '',
          treeCustomization: {},
          level: 1,
          currentXp: 0,
          requiredXp: 100,
          health: 100,
          lastWatered: null,
          lastFertilized: null,
          plantedAt: Date.now(),
          updatedAt: Date.now()
        })
      }
    }
    
    const updateData = {
      $set: {
        gardenPlots: plots,
        updatedAt: Date.now()
      }
    }
    
    await updateGarden(garden, updateData)
    return await getOrCreateGarden(userId)
  } catch (error) {
    throw error
  }
}

// Customize the master tree design
const customizeTree = async (userId, customization) => {
  try {
    // Find and update user's garden in UserGarden model
    const garden = await UserGarden.findOneAndUpdate(
      { userId },
      {
        $set: {
          treeCustomization: {
            name: customization.name || 'Cây của tôi',
            treeType: customization.treeType || 'rose',
            color: customization.color || '#E91E63',
            potType: customization.potType || 'pot1',
            potColor: customization.potColor || '#D7CCC8',
            effects: customization.effects || 'none'
          },
          updatedAt: Date.now()
        }
      },
      { new: true, upsert: false }
    )

    if (!garden) {
      throw new ApiError(404, 'User garden not found')
    }

    return garden
  } catch (error) {
    throw error
  }
}

// Plant tree in garden plot
const plantTreeInPlot = async (userId, plotId, treeData) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Initialize plots if not exist
    if (!garden.gardenPlots || garden.gardenPlots.length === 0) {
      await initializeGardenPlots(userId)
      return plantTreeInPlot(userId, plotId, treeData)
    }
    
    // Find the plot
    const plotIndex = garden.gardenPlots.findIndex(p => p.plotId === plotId)
    if (plotIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Ô trống không tồn tại!')
    }
    
    const plot = garden.gardenPlots[plotIndex]
    if (plot.treeId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ô này đã có cây rồi!')
    }
    
    // Generate tree ID
    const treeId = `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Update plot with new tree
    const updateData = {
      $set: {
        [`gardenPlots.${plotIndex}`]: {
          ...plot,
          treeId,
          treeName: treeData.treeCustomization?.name || 'Cây của tôi',
          treeCustomization: treeData.treeCustomization || {},
          level: 1,
          currentXp: 0,
          requiredXp: 100,
          health: 100,
          plantedAt: Date.now(),
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }
    }
    
    await updateGarden(garden, updateData)
    return await getOrCreateGarden(userId)
  } catch (error) {
    throw error
  }
}

// Care for tree in plot (water/fertilize)
const performGardenAction = async (userId, plotId, action) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Find the plot
    const plotIndex = garden.gardenPlots.findIndex(p => p.plotId === plotId)
    if (plotIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Ô trống không tồn tại!')
    }
    
    const plot = garden.gardenPlots[plotIndex]
    if (!plot.treeId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ô này không có cây!')
    }
    
    let xpGain = 0
    let healthGain = 0
    let xpAmount = 0
    
    switch (action) {
      case 'water':
        xpGain = 15
        healthGain = 10
        xpAmount = 10
        break
      case 'fertilize':
        xpGain = 25
        healthGain = 20
        xpAmount = 20
        break
      default:
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Hành động không hợp lệ!')
    }
    
    // Calculate new values
    const newHealth = Math.min(100, plot.health + healthGain)
    const newXp = plot.currentXp + xpGain
    let newLevel = plot.level
    let levelUp = false
    
    // Level up if XP threshold reached
    if (newXp >= plot.requiredXp) {
      newLevel += 1
      levelUp = true
    }
    
    const updateData = {
      $set: {
        [`gardenPlots.${plotIndex}`]: {
          ...plot,
          level: newLevel,
          currentXp: newXp >= plot.requiredXp ? 0 : newXp,
          requiredXp: newLevel * 100,
          health: newHealth,
          [action === 'water' ? 'lastWatered' : 'lastFertilized']: Date.now(),
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      },
      $inc: {
        currentXp: xpAmount
      }
    }
    
    await updateGarden(garden, updateData)
    
    return {
      garden: await getOrCreateGarden(userId),
      levelUp,
      rewards: { xp: xpAmount }
    }
  } catch (error) {
    throw error
  }
}

// Harvest tree in plot
const harvestGardenTree = async (userId, plotId) => {
  try {
    const garden = await getOrCreateGarden(userId)
    
    // Find the plot
    const plotIndex = garden.gardenPlots.findIndex(p => p.plotId === plotId)
    if (plotIndex === -1) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Ô trống không tồn tại!')
    }
    
    const plot = garden.gardenPlots[plotIndex]
    if (!plot.treeId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ô này không có cây!')
    }
    
    // Calculate rewards based on level
    const baseXp = 50
    const xpReward = baseXp * plot.level
    
    // Reset plot to empty
    const updateData = {
      $set: {
        [`gardenPlots.${plotIndex}`]: {
          plotId: plot.plotId,
          position: plot.position,
          treeId: null,
          treeName: '',
          treeCustomization: {},
          level: 1,
          currentXp: 0,
          requiredXp: 100,
          health: 100,
          lastWatered: null,
          lastFertilized: null,
          plantedAt: Date.now(),
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      },
      $inc: {
        currentXp: xpReward
      }
    }
    
    await updateGarden(garden, updateData)
    
    return {
      garden: await getOrCreateGarden(userId),
      rewards: { xp: xpReward }
    }
  } catch (error) {
    throw error
  }
}

export const gardenService = {
  getOrCreateGarden,
  getGardenDetails,
  getAvailableVouchers,
  claimVoucher,
  plantTree,
  waterTree,
  fertilizeTree,
  harvestTree,
  buyItem,
  placeDecoration,
  initializeGardenPlots,
  customizeTree,
  plantTreeInPlot,
  performGardenAction,
  harvestGardenTree
}