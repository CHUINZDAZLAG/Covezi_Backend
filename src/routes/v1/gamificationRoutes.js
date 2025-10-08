import { Router } from 'express'
import GamificationController from '~/controllers/gamificationController.js'
import { authMiddleware } from '~/middlewares/authMiddleware.js'

const router = Router()

// === GET MY GARDEN (Vườn Của Tôi) ===
// Includes: level, XP, pet, crops, inventory, vouchers - all in one
router.get('/user-garden', authMiddleware.isAuthorized, GamificationController.getUserGarden)

// === XP REWARDS ===
// Daily login: +5 XP
router.post('/daily-login', authMiddleware.isAuthorized, GamificationController.claimDailyLoginReward)

// Challenge: +10 XP for join, +20 for complete
router.post('/join-challenge', authMiddleware.isAuthorized, GamificationController.joinChallenge)
router.post('/complete-challenge', authMiddleware.isAuthorized, GamificationController.completeChallenge)

// Creator bonus: +30 XP when challenge has >10 participants
router.post('/creator-bonus', authMiddleware.isAuthorized, GamificationController.awardCreatorBonus)

// === GARDEN - CROPS ===
router.post('/plant-seed', authMiddleware.isAuthorized, GamificationController.plantSeed)
router.post('/care-plant', authMiddleware.isAuthorized, GamificationController.careForPlant)
router.post('/harvest-crop', authMiddleware.isAuthorized, GamificationController.harvestCrop)
router.post('/customize-tree-plot', authMiddleware.isAuthorized, GamificationController.customizeTreePlot)

// === GARDEN GRID - NEW SYSTEM ===
router.post('/customize-tree', authMiddleware.isAuthorized, GamificationController.customizeTree)
router.post('/plant-tree-in-plot', authMiddleware.isAuthorized, GamificationController.plantTreeInPlot)
router.post('/garden-action', authMiddleware.isAuthorized, GamificationController.performGardenAction)
router.post('/harvest-garden-tree', authMiddleware.isAuthorized, GamificationController.harvestGardenTree)

// === PET (CHICKEN) ===
router.post('/customize-pet', authMiddleware.isAuthorized, GamificationController.customizePet)
router.post('/feed-pet', authMiddleware.isAuthorized, GamificationController.feedPet)
router.post('/collect-egg', authMiddleware.isAuthorized, GamificationController.collectEgg)

// === VOUCHERS ===
router.get('/vouchers', authMiddleware.isAuthorized, GamificationController.getUserVouchers)
router.post('/use-voucher', authMiddleware.isAuthorized, GamificationController.useVoucher)

// === LEADERBOARD & RANK ===
router.get('/leaderboard', GamificationController.getLeaderboard)
router.get('/user-rank', authMiddleware.isAuthorized, GamificationController.getUserRank)

// === ADMIN ===
router.get('/admin/config', authMiddleware.isAuthorized, GamificationController.getConfig)
router.put('/admin/config', authMiddleware.isAuthorized, GamificationController.updateConfig)
router.put('/admin/voucher-tier', authMiddleware.isAuthorized, GamificationController.updateVoucherTier)

// NEW: Admin voucher milestone management
router.get('/admin/voucher-milestones', authMiddleware.isAuthorized, GamificationController.getVoucherMilestones)
router.post('/admin/voucher-milestones', authMiddleware.isAuthorized, GamificationController.addVoucherMilestone)
router.put('/admin/voucher-milestones/:level', authMiddleware.isAuthorized, GamificationController.updateVoucherMilestone)
router.delete('/admin/voucher-milestones/:level', authMiddleware.isAuthorized, GamificationController.deleteVoucherMilestone)

// NEW: Admin tree growth stage management
router.get('/admin/tree-stages', authMiddleware.isAuthorized, GamificationController.getTreeGrowthStages)
router.put('/admin/tree-stages', authMiddleware.isAuthorized, GamificationController.updateTreeGrowthStages)

// NEW: Admin land unlock tiers management
router.get('/admin/land-tiers', authMiddleware.isAuthorized, GamificationController.getLandUnlockTiers)
router.put('/admin/land-tiers', authMiddleware.isAuthorized, GamificationController.updateLandUnlockTiers)

export const gamificationRoutes = router
