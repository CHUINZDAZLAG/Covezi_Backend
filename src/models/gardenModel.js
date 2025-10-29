import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { TREE_TYPES, TREE_STATUS, GARDEN_ACTIONS } from '~/utils/constants'

// Define collection name and schema
const GARDEN_COLLECTION_NAME = 'gardens'
const GARDEN_COLLECTION_SCHEMA = Joi.object({
  // Owner information
  userId: Joi.string().required(),
  
  // Garden general info
  name: Joi.string().trim().strict().default('Vườn của tôi'),
  description: Joi.string().trim().default(''),
  level: Joi.number().min(1).default(1),
  experience: Joi.number().min(0).default(0),
  currentXp: Joi.number().min(0).default(0),
  nextLevelXp: Joi.number().min(0).default(50),
  
  // Tree customization (master tree design)
  treeCustomization: Joi.object({
    name: Joi.string().trim().default('Cây của tôi'),
    color: Joi.string().trim().default('#4CAF50'),
    potType: Joi.string().trim().default('pot1'),
    potColor: Joi.string().trim().default('#D7CCC8'),
    effects: Joi.string().trim().default('none')
  }).default({}),
  
  // Garden plots (multiple tree plantings)
  gardenPlots: Joi.array().items(
    Joi.object({
      plotId: Joi.string().required(), // e.g., plot_0_0, plot_0_1, etc
      position: Joi.object({
        row: Joi.number().required(),
        col: Joi.number().required()
      }).default({}),
      
      // Tree data
      treeId: Joi.string().default(null),
      treeName: Joi.string().trim().default(''),
      treeCustomization: Joi.object({
        name: Joi.string().trim().default('Cây của tôi'),
        color: Joi.string().trim().default('#4CAF50'),
        potType: Joi.string().trim().default('pot1'),
        potColor: Joi.string().trim().default('#D7CCC8'),
        effects: Joi.string().trim().default('none')
      }).default({}),
      
      // Plot level and experience
      level: Joi.number().min(1).default(1),
      currentXp: Joi.number().min(0).default(0),
      requiredXp: Joi.number().min(1).default(100),
      health: Joi.number().min(0).max(100).default(100),
      
      // Care tracking
      lastWatered: Joi.date().timestamp('javascript').default(null),
      lastFertilized: Joi.date().timestamp('javascript').default(null),
      
      // Timestamps
      plantedAt: Joi.date().timestamp('javascript').default(Date.now),
      updatedAt: Joi.date().timestamp('javascript').default(Date.now)
    })
  ).default([]),
  
  // Garden layout and customization
  layout: Joi.object({
    background: Joi.string().trim().default('default_bg.jpg'),
    theme: Joi.string().trim().default('nature'),
    decorations: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(), // 'fence', 'stone', 'fountain', etc.
        position: Joi.object({
          x: Joi.number().required(),
          y: Joi.number().required()
        }).required(),
        imageUrl: Joi.string().trim().default('')
      })
    ).default([])
  }).default({}),
  
  // Garden statistics
  stats: Joi.object({
    totalTrees: Joi.number().min(0).default(0),
    matureTrees: Joi.number().min(0).default(0),
    totalCarbonAbsorbed: Joi.number().min(0).default(0),
    totalOxygenProduced: Joi.number().min(0).default(0),
    totalFruitsHarvested: Joi.number().min(0).default(0),
    daysActive: Joi.number().min(0).default(0),
    lastActiveDate: Joi.date().timestamp('javascript').default(Date.now)
  }).default({}),
  
  // Resources and inventory
  inventory: Joi.object({
    seeds: Joi.object({
      oak: Joi.number().min(0).default(0),
      pine: Joi.number().min(0).default(0),
      bamboo: Joi.number().min(0).default(0),
      flower: Joi.number().min(0).default(0)
    }).default({}),
    water: Joi.number().min(0).default(100), // Water units
    fertilizer: Joi.number().min(0).default(10), // Fertilizer units
    decorations: Joi.array().items(Joi.string()).default([]),
    tools: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        durability: Joi.number().min(0).max(100).default(100)
      })
    ).default([])
  }).default({}),
  
  // Vouchers received
  vouchersReceived: Joi.array().items(
    Joi.object({
      code: Joi.string().required(),
      type: Joi.string().default('discount'),
      value: Joi.string().default(''),
      description: Joi.string().default('')
    })
  ).default([]),
  
  // Achievements and milestones
  achievements: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().trim().default(''),
      unlockedAt: Joi.date().timestamp('javascript').default(Date.now),
      icon: Joi.string().trim().default('')
    })
  ).default([]),
  
  // Social features
  isPublic: Joi.boolean().default(true), // Allow others to visit
  visitors: Joi.array().items(
    Joi.object({
      userId: Joi.string().required(),
      visitedAt: Joi.date().timestamp('javascript').default(Date.now),
      liked: Joi.boolean().default(false)
    })
  ).default([]),
  totalLikes: Joi.number().min(0).default(0),
  totalVisitors: Joi.number().min(0).default(0),
  
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await GARDEN_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdGarden = await GET_DB().collection(GARDEN_COLLECTION_NAME).insertOne(validData)
    return createdGarden
  } catch (error) { throw new Error(error) }
}

const findByUserId = async (userId) => {
  try {
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOne({
      userId: userId,
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

const initializeGarden = async (userId) => {
  try {
    // Check if garden already exists
    const existingGarden = await findByUserId(userId)
    if (existingGarden) return existingGarden
    
    // Create new garden with starter resources
    const gardenData = {
      userId,
      name: 'Vườn của tôi',
      level: 1,
      experience: 0,
      currentXp: 0,
      nextLevelXp: 100,
      inventory: {
        seeds: { oak: 2, flower: 3 },
        water: 100,
        fertilizer: 10,
        decorations: [],
        tools: [
          { id: 'basic_shovel', name: 'Xẻng cơ bản', durability: 100 },
          { id: 'watering_can', name: 'Bình tưới', durability: 100 }
        ]
      },
      stats: {
        totalTrees: 0,
        matureTrees: 0,
        totalCarbonAbsorbed: 0,
        totalOxygenProduced: 0,
        totalFruitsHarvested: 0,
        daysActive: 0,
        lastActiveDate: Date.now()
      }
    }
    
    const result = await createNew(gardenData)
    return result
  } catch (error) { throw new Error(error) }
}

const plantTree = async (userId, treeData) => {
  try {
    const { type, position, name = '' } = treeData
    
    // Check if user has seeds
    const garden = await findByUserId(userId)
    if (!garden) throw new Error('Garden not found')
    
    if (garden.inventory.seeds[type] <= 0) {
      throw new Error('Not enough seeds')
    }
    
    // Generate unique tree ID
    const treeId = new ObjectId().toString()
    
    const newTree = {
      id: treeId,
      type,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Tree`,
      status: TREE_STATUS.SEED,
      growthStage: 0,
      health: 100,
      position,
      appearance: { size: 'small', color: '', accessories: [] },
      careHistory: [{
        action: GARDEN_ACTIONS.PLANT,
        timestamp: Date.now(),
        effect: { growth: 0, health: 0, experience: 10 }
      }],
      fruitsHarvested: 0,
      carbonAbsorbed: 0,
      oxygenProduced: 0,
      plantedAt: Date.now(),
      matureAt: null
    }
    
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $push: { trees: newTree },
        $inc: {
          [`inventory.seeds.${type}`]: -1,
          experience: 10,
          'stats.totalTrees': 1
        },
        $set: {
          updatedAt: Date.now(),
          'stats.lastActiveDate': Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    
    return result
  } catch (error) { throw new Error(error) }
}

const performAction = async (userId, actionData) => {
  try {
    const { treeId, action } = actionData
    const garden = await findByUserId(userId)
    if (!garden) throw new Error('Garden not found')
    
    const treeIndex = garden.trees.findIndex(t => t.id === treeId)
    if (treeIndex === -1) throw new Error('Tree not found')
    
    const tree = garden.trees[treeIndex]
    let effect = { growth: 0, health: 0, experience: 0 }
    let resourceCost = {}
    
    // Calculate action effects
    switch (action) {
      case GARDEN_ACTIONS.WATER:
        if (garden.inventory.water <= 0) throw new Error('Not enough water')
        effect = { growth: 15, health: 10, experience: 5 }
        resourceCost = { water: 1 }
        break
      case GARDEN_ACTIONS.FERTILIZE:
        if (garden.inventory.fertilizer <= 0) throw new Error('Not enough fertilizer')
        effect = { growth: 25, health: 20, experience: 10 }
        resourceCost = { fertilizer: 1 }
        break
      case GARDEN_ACTIONS.HARVEST:
        if (tree.status !== TREE_STATUS.MATURE) throw new Error('Tree not ready for harvest')
        effect = { growth: -50, health: 0, experience: 50 }
        break
      default:
        throw new Error('Invalid action')
    }
    
    // Apply effects
    const newGrowthStage = Math.min(100, Math.max(0, tree.growthStage + effect.growth))
    const newHealth = Math.min(100, Math.max(0, tree.health + effect.health))
    
    // Determine new status based on growth stage
    let newStatus = tree.status
    if (newGrowthStage >= 75) newStatus = TREE_STATUS.MATURE
    else if (newGrowthStage >= 50) newStatus = TREE_STATUS.BLOOMING
    else if (newGrowthStage >= 25) newStatus = TREE_STATUS.GROWING
    
    const updateData = {
      [`trees.${treeIndex}.growthStage`]: newGrowthStage,
      [`trees.${treeIndex}.health`]: newHealth,
      [`trees.${treeIndex}.status`]: newStatus,
      [`trees.${treeIndex}.lastWatered`]: action === GARDEN_ACTIONS.WATER ? Date.now() : tree.lastWatered,
      [`trees.${treeIndex}.lastFertilized`]: action === GARDEN_ACTIONS.FERTILIZE ? Date.now() : tree.lastFertilized,
      experience: garden.experience + effect.experience,
      updatedAt: Date.now(),
      'stats.lastActiveDate': Date.now()
    }
    
    // Apply resource costs
    Object.keys(resourceCost).forEach(resource => {
      updateData[`inventory.${resource}`] = garden.inventory[resource] - resourceCost[resource]
    })
    
    // Handle harvest rewards
    if (action === GARDEN_ACTIONS.HARVEST) {
      updateData[`trees.${treeIndex}.fruitsHarvested`] = tree.fruitsHarvested + 1
      updateData['stats.totalFruitsHarvested'] = (garden.stats.totalFruitsHarvested || 0) + 1
    }
    
    // Add to care history
    const careEntry = {
      action,
      timestamp: Date.now(),
      effect
    }
    
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $set: updateData,
        $push: { [`trees.${treeIndex}.careHistory`]: careEntry }
      },
      { returnDocument: 'after' }
    )
    
    return result
  } catch (error) { throw new Error(error) }
}

const updateInventory = async (userId, items) => {
  try {
    const updateData = { updatedAt: Date.now() }
    
    Object.keys(items).forEach(item => {
      if (item.startsWith('seeds.')) {
        updateData[`inventory.${item}`] = items[item]
      } else {
        updateData[`inventory.${item}`] = items[item]
      }
    })
    
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { userId },
      { $inc: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const syncGarden = async (userId, syncData) => {
  try {
    // This endpoint is for third-party game engine integration
    // Update tree animations, growth status, visual effects, etc.
    const updateData = {
      ...syncData,
      updatedAt: Date.now(),
      'stats.lastActiveDate': Date.now()
    }
    
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Add challenge points to garden experience
const addChallengePoints = async (userId, points) => {
  try {
    let garden = await findByUserId(userId)

    // Initialize garden if not exists
    if (!garden) {
      await initializeGarden(userId)
      garden = await findByUserId(userId)
    }

    if (!garden) throw new Error('Could not initialize garden')

    // Calculate new experience and level
    const newExperience = garden.experience + points

    // Level thresholds (can be customized)
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 7000, 9000, 11500, 14500, 18000]
    let newLevel = 1
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (newExperience >= levelThresholds[i]) {
        newLevel = i + 1
        break
      }
    }

    // Calculate currentXp (XP towards next level)
    // currentXp = newExperience - thresholdForCurrentLevel
    const currentLevelThreshold = levelThresholds[newLevel - 1] || 0
    const newCurrentXp = newExperience - currentLevelThreshold

    // Calculate nextLevelXp (XP needed for next level)
    // nextLevelXp = thresholdForNextLevel - thresholdForCurrentLevel
    const nextLevelThreshold = levelThresholds[newLevel] || levelThresholds[levelThresholds.length - 1]
    const newNextLevelXp = nextLevelThreshold - currentLevelThreshold

    const leveledUp = newLevel > garden.level

    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $inc: { experience: points },
        $set: {
          level: newLevel,
          currentXp: newCurrentXp,
          nextLevelXp: newNextLevelXp,
          updatedAt: Date.now(),
          'stats.lastActiveDate': Date.now()
        }
      },
      { returnDocument: 'after' }
    )

    return { garden: result, leveledUp, newLevel }
  } catch (error) { throw new Error(error) }
}

// Get vouchers available for user's level
const getAvailableVouchers = async (userId) => {
  try {
    const garden = await findByUserId(userId)
    if (!garden) return []

    // Voucher rewards by level
    const vouchersByLevel = {
      5: { code: 'ECO5', discount: 5, description: '5% off eco products' },
      10: { code: 'ECO10', discount: 10, description: '10% off eco products' },
      15: { code: 'ECO15', discount: 15, description: '15% off eco products' },
      20: { code: 'ECO20', discount: 20, description: '20% off eco products' }
    }

    const availableVouchers = []
    Object.keys(vouchersByLevel).forEach(level => {
      if (garden.level >= parseInt(level)) {
        availableVouchers.push({
          ...vouchersByLevel[level],
          unlockLevel: parseInt(level)
        })
      }
    })

    return availableVouchers
  } catch (error) { throw new Error(error) }
}

// Update garden by ID
const update = async (gardenId, updateData) => {
  try {
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(gardenId), _destroy: false },
      updateData,
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Find garden by ID
const findById = async (gardenId) => {
  try {
    const result = await GET_DB().collection(GARDEN_COLLECTION_NAME).findOne({
      _id: new ObjectId(gardenId),
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

export const gardenModel = {
  GARDEN_COLLECTION_NAME,
  GARDEN_COLLECTION_SCHEMA,
  createNew,
  findByUserId,
  findById,
  initializeGarden,
  plantTree,
  performAction,
  updateInventory,
  syncGarden,
  addChallengePoints,
  getAvailableVouchers,
  update
}