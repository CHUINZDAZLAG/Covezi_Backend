import mongoose from 'mongoose'

// Gamification configuration schema (Admin configurable)
const gamificationConfigSchema = new mongoose.Schema(
  {
    maxLevel: {
      type: Number,
      default: 10000,
      description: 'Maximum level users can reach (spec: up to 10,000)'
    },
    xpPerLevel: {
      type: Number,
      default: 50,
      description: '1 level = N XP (e.g., 50 XP = 1 level)'
    },
    pointsConfig: {
      joinChallenge: { type: Number, default: 10, description: 'XP for joining 1 challenge (once per day max)' },
      completeChallenge: { type: Number, default: 20, description: 'XP for completing challenge' },
      createChallengeAbove10: { type: Number, default: 30, description: 'XP bonus if challenge has >10 participants' },
      dailyLogin: { type: Number, default: 5, description: 'XP for daily login' }
    },
    // Admin-configurable voucher milestones: level → discountPercent
    voucherMilestones: {
      type: [
        {
          level: { type: Number, required: true },
          discountPercent: { type: Number, required: true, min: 0, max: 100 },
          description: String,
          isDefault: { type: Boolean, default: true }
        }
      ],
      default: [
        { level: 20, discountPercent: 10, description: 'Lv20: 10% voucher', isDefault: true },
        { level: 80, discountPercent: 20, description: 'Lv80: 20% voucher', isDefault: true },
        { level: 150, discountPercent: 30, description: 'Lv150: 30% voucher', isDefault: true },
        { level: 300, discountPercent: 50, description: 'Lv300: 50% voucher', isDefault: true },
        { level: 500, discountPercent: 70, description: 'Lv500: 70% voucher', isDefault: true },
        { level: 1000, discountPercent: 100, description: 'Lv1000: 100% voucher', isDefault: true }
      ]
    },
    voucherValidityDays: {
      type: Number,
      default: 180,
      description: 'Voucher validity period in days (6 months)'
    },
    // Tree growth stages configuration
    treeGrowthStages: {
      type: [
        {
          stage: Number,
          levelMin: Number,
          levelMax: Number,
          name: String,
          description: String
        }
      ],
      default: [
        { stage: 1, levelMin: 1, levelMax: 20, name: 'Sprout', description: 'Tiny seedling' },
        { stage: 2, levelMin: 21, levelMax: 80, name: 'Young Tree', description: 'Small tree' },
        { stage: 3, levelMin: 81, levelMax: 200, name: 'Mature', description: 'Full-sized tree' },
        { stage: 4, levelMin: 201, levelMax: 500, name: 'Epic Tree', description: 'Large tree with special effects' },
        { stage: 5, levelMin: 501, levelMax: 10000, name: 'Legendary Tree', description: 'Legendary tree with animations' }
      ]
    },
    // Land unlock tiers by level
    landUnlockTiers: {
      type: [
        {
          level: Number,
          unlockedPlots: Number,
          name: String,
          description: String
        }
      ],
      default: [
        { level: 1, unlockedPlots: 1, name: 'Starter', description: '1 plot (default)' },
        { level: 20, unlockedPlots: 2, name: 'Explorer', description: '2 plots unlocked' },
        { level: 80, unlockedPlots: 5, name: 'Farmer', description: '5 plots - farm level' },
        { level: 150, unlockedPlots: 10, name: 'Master Farmer', description: '10 plots - full farm' },
        { level: 300, unlockedPlots: 15, name: 'Premium Farm', description: '15 plots + special zones (water, mountains)' },
        { level: 500, unlockedPlots: 20, name: 'Legendary Farm', description: '20 plots + European village theme' },
        { level: 2000, unlockedPlots: 30, name: 'Mythical Farm', description: '30 plots + legendary effects & day/night cycle' }
      ]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)


// Voucher schema - auto-generated when level milestone reached
const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      description: 'Unique voucher code'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    levelEarned: {
      type: Number,
      required: true,
      description: 'User level when voucher was earned'
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      description: 'Discount percentage based on level tier'
    },
    status: {
      type: String,
      enum: ['active', 'used', 'expired'],
      default: 'active'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      description: 'Expires 6 months after issue'
    },
    usedAt: Date,
    usedOnOrderId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)


// Consolidated User Garden model - combines stats, farm, pet, inventory
const userGardenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      description: 'One garden per user'
    },
    // === LEVEL & XP SYSTEM ===
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10000
    },
    currentXp: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Total XP accumulated'
    },
    nextLevelXp: {
      type: Number,
      default: 50,
      description: 'XP needed for next level'
    },
    // === TREE & CHICKEN PROGRESSION ===
    treeStage: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
      description: '5 growth stages: Sprout → Young → Mature → Epic → Legendary (auto-upgrade with level)'
    },
    chickenStage: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
      description: 'Unlocked based on level milestones'
    },
    // === LAND UNLOCKING ===
    landUnlocked: {
      type: Number,
      default: 1,
      description: 'Number of plots user can use (unlocked by level milestones)'
    },
    landTheme: {
      type: String,
      enum: ['starter', 'explorer', 'farmer', 'master', 'premium', 'legendary', 'mythical'],
      default: 'starter',
      description: 'Visual theme of farm based on unlock tier'
    },
    // === PET (CHICKEN) - ONE PER USER ===
    pet: {
      name: { type: String, default: 'My Pet', maxlength: 50 },
      stage: { type: Number, default: 1, min: 1, max: 5 },
      bornAt: { type: Date, default: Date.now },
      lastFedAt: Date,
      lastEggCollectedAt: Date,
      nextEggReadyAt: Date,
      health: { type: Number, default: 100, min: 0, max: 100 },
      eggs: { type: Number, default: 0, min: 0 },
      color: {
        type: String,
        enum: ['brown', 'white', 'black', 'gold', 'red', 'orange'],
        default: 'brown'
      },
      decorations: {
        hat: { type: String, enum: ['none', 'farmer', 'crown', 'cowboy', 'party'], default: 'none' },
        shirt: { type: String, enum: ['none', 'striped', 'polka', 'checkered'], default: 'none' },
        scarf: { type: String, enum: ['none', 'red', 'blue', 'green'], default: 'none' },
        wings: { type: String, enum: ['normal', 'sparkle', 'feather', 'flame'], default: 'normal' }
      }
    },
    // === PET CUSTOMIZATION (UI) ===
    petCustomization: {
      name: { type: String, default: 'Gà của tôi', maxlength: 50 },
      style: { type: String, default: 'fonze' },
      color: { type: String, default: '#ff9800' },
      decorations: { type: [String], default: [] }
    },
    // === TREE CUSTOMIZATION (UI) ===
    treeCustomization: {
      name: { type: String, default: 'Cây của tôi', maxlength: 50 },
      treeType: { type: String, default: 'rose' },
      color: { type: String, default: '#E91E63' },
      potType: { type: String, default: 'pot1' },
      potColor: { type: String, default: '#D7CCC8' },
      effects: { type: String, default: 'none' }
    },
    // === GARDEN PLOTS (CROPS) ===
    gardenPlots: [
      {
        id: String,
        cropType: {
          type: String,
          enum: ['apple', 'mango', 'tomato', 'carrot', 'strawberry', 'corn', 'pumpkin', 'sunflower', 'lettuce', 'potato']
        },
        stage: { type: Number, min: 0, max: 4, description: '0=seed, 1=sprout, 2=growing, 3=flowering, 4=ready' },
        stageProgress: { type: Number, default: 0, min: 0, max: 100 },
        plantedAt: Date,
        harvestedAt: Date,
        health: { type: Number, default: 100, min: 0, max: 100 },
        lastWateredAt: Date,
        lastFertilizedAt: Date,
        hasBeenHarvested: { type: Boolean, default: false },
        potType: { type: String, enum: ['ceramic', 'clay', 'plastic', 'wooden', 'golden'], default: 'ceramic' },
        effect: { type: String, enum: ['none', 'glow', 'sparkle', 'leaves', 'flowers'], default: 'none' }
      }
    ],
    // === INVENTORY ===
    inventory: {
      eggs: { type: Number, default: 0, min: 0 },
      crops: {
        apple: { type: Number, default: 0 },
        mango: { type: Number, default: 0 },
        tomato: { type: Number, default: 0 },
        carrot: { type: Number, default: 0 },
        strawberry: { type: Number, default: 0 },
        corn: { type: Number, default: 0 },
        pumpkin: { type: Number, default: 0 },
        sunflower: { type: Number, default: 0 },
        lettuce: { type: Number, default: 0 },
        potato: { type: Number, default: 0 }
      },
      seeds: {
        appleSeed: { type: Number, default: 5 },
        mangoSeed: { type: Number, default: 5 },
        tomatoSeed: { type: Number, default: 5 },
        carrotSeed: { type: Number, default: 5 },
        strawberrySeed: { type: Number, default: 3 },
        cornSeed: { type: Number, default: 3 },
        pumpkinSeed: { type: Number, default: 3 },
        sunflowerSeed: { type: Number, default: 3 },
        lettuceSeed: { type: Number, default: 5 },
        potatoSeed: { type: Number, default: 5 }
      },
      fertilizers: { type: Number, default: 10 }
    },
    // === VOUCHER TRACKING ===
    voucherMilestonesClaimed: [
      {
        level: Number,
        claimedAt: { type: Date, default: Date.now },
        discountPercent: Number
      }
    ],
    vouchersReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher'
      }
    ],
    // === DAILY LOGIN TRACKING ===
    lastDailyLoginDate: Date,
    // === CHALLENGE TRACKING ===
    challengeHistory: [
      {
        challengeId: mongoose.Schema.Types.ObjectId,
        action: { type: String, enum: ['joined', 'completed', 'created'] },
        xpEarned: Number,
        earnedAt: { type: Date, default: Date.now }
      }
    ],
    // === ACTIVITY LOG ===
    activityLog: [
      {
        action: String,
        details: String,
        xpEarned: Number,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)


// Farm garden plot schema - supports 10 crop types with customization
const gardenPlotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cropType: {
      type: String,
      enum: ['apple', 'mango', 'tomato', 'carrot', 'strawberry', 'corn', 'pumpkin', 'sunflower', 'lettuce', 'potato'],
      required: true
    },
    stage: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
      description: '0=seed, 1=sprout, 2=growing, 3=flowering, 4=ready'
    },
    stageProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Progress percentage within current stage'
    },
    plantedAt: {
      type: Date,
      required: true
    },
    harvestedAt: Date,
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    lastWateredAt: Date,
    lastFertilizedAt: Date,
    hasBeenHarvested: {
      type: Boolean,
      default: false
    },
    // Customization
    potType: {
      type: String,
      enum: ['ceramic', 'clay', 'plastic', 'wooden', 'golden'],
      default: 'ceramic'
    },
    effect: {
      type: String,
      enum: ['none', 'glow', 'sparkle', 'leaves', 'flowers'],
      default: 'none'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

export const GamificationConfig = mongoose.model('GamificationConfig', gamificationConfigSchema)
export const Voucher = mongoose.model('Voucher', voucherSchema)
export const UserGarden = mongoose.model('UserGarden', userGardenSchema)
export const GardenPlot = mongoose.model('GardenPlot', gardenPlotSchema)

