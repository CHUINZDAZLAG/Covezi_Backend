/**
 * @swagger
 * tags:
 *   - name: Gamification
 *     description: 🎮 XP system, garden management, leaderboard, and achievement rewards
 */

import { Router } from 'express'
import GamificationController from '~/controllers/gamificationController.js'
import { authMiddleware } from '~/middlewares/authMiddleware.js'

const router = Router()

/**
 * @swagger
 * /v1/gamification/user-garden:
 *   get:
 *     tags: [Gamification]
 *     summary: 🌳 Get user's complete garden
 *     description: Get comprehensive garden data - level, XP, trees, crops, pets, inventory, vouchers all in one call
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Garden data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: number
 *                       example: 12
 *                     currentXP:
 *                       type: number
 *                       example: 2450
 *                     xpToNextLevel:
 *                       type: number
 *                       example: 550
 *                     totalXPForNextLevel:
 *                       type: number
 *                       example: 3000
 *                     rank:
 *                       type: number
 *                       example: 147
 *                     garden:
 *                       type: object
 *                       properties:
 *                         plots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               plotId:
 *                                 type: number
 *                               cropType:
 *                                 type: string
 *                               plantedAt:
 *                                 type: number
 *                               harvestableAt:
 *                                 type: number
 *                               stage:
 *                                 type: string
 *                                 enum: [seed, sprout, growing, ready, harvested]
 *                         pets:
 *                           type: array
 *                         decorations:
 *                           type: array
 *                     vouchers:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: number
 *                         totalEarned:
 *                           type: number
 *                     achievements:
 *                       type: array
 *             example:
 *               success: true
 *               data:
 *                 level: 12
 *                 currentXP: 2450
 *                 xpToNextLevel: 550
 *                 rank: 147
 *                 garden:
 *                   plots:
 *                     - plotId: 1
 *                       cropType: "tomato"
 *                       stage: "ready"
 *                       harvestableAt: 1733097600000
 *                 vouchers:
 *                   available: 3
 *                   totalEarned: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/user-garden', authMiddleware.isAuthorized, GamificationController.getUserGarden)

/**
 * @swagger
 * /v1/gamification/daily-login:
 *   post:
 *     tags: [Gamification]
 *     summary: 🎯 Claim daily login reward
 *     description: Claim daily login bonus (+5 XP). Can only be claimed once per day.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Daily login reward claimed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Daily login reward claimed! +5 XP"
 *                 data:
 *                   type: object
 *                   properties:
 *                     xpGained:
 *                       type: number
 *                       example: 5
 *                     newXP:
 *                       type: number
 *                       example: 2455
 *                     levelUp:
 *                       type: boolean
 *                     newLevel:
 *                       type: number
 *                     nextClaimTime:
 *                       type: number
 *       400:
 *         description: ❌ Already claimed today
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Daily reward already claimed. Next claim in 8 hours."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/daily-login', authMiddleware.isAuthorized, GamificationController.claimDailyLoginReward)

// Challenge: +10 XP for join, +20 for complete
router.post('/join-challenge', authMiddleware.isAuthorized, GamificationController.joinChallenge)
router.post('/complete-challenge', authMiddleware.isAuthorized, GamificationController.completeChallenge)

// Creator bonus: +30 XP when challenge has >10 participants
router.post('/creator-bonus', authMiddleware.isAuthorized, GamificationController.awardCreatorBonus)

// === GARDEN - CROPS ===
// Keeping basic endpoints for reference, but simplified

/**
 * @swagger
 * /v1/gamification/leaderboard:
 *   get:
 *     tags: [Gamification]
 *     summary: 🏆 Get global leaderboard
 *     description: Get top players by XP/level with rankings and achievements
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *           maximum: 100
 *         description: Number of top players to return
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [all, weekly, monthly]
 *           default: all
 *     responses:
 *       200:
 *         description: ✅ Leaderboard retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: number
 *                           user:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                               level:
 *                                 type: number
 *                               totalXP:
 *                                 type: number
 *                               joinedDate:
 *                                 type: number
 *                     myRank:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         rank:
 *                           type: number
 *                         level:
 *                           type: number
 *                         xp:
 *                           type: number
 *             example:
 *               success: true
 *               data:
 *                 leaderboard:
 *                   - rank: 1
 *                     user:
 *                       username: "EcoWarrior2024"
 *                       level: 25
 *                       totalXP: 15750
 *                       avatar: "https://cloudinary.../avatar.jpg"
 *                 myRank:
 *                   rank: 147
 *                   level: 12
 *                   xp: 2450
 */
router.get('/leaderboard', GamificationController.getLeaderboard)

/**
 * @swagger
 * /v1/gamification/user-rank:
 *   get:
 *     tags: [Gamification]
 *     summary: 📈 Get current user's rank
 *     description: Get authenticated user's current ranking and position in leaderboard
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ User rank retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rank:
 *                       type: number
 *                       example: 147
 *                     level:
 *                       type: number
 *                       example: 12
 *                     totalXP:
 *                       type: number
 *                       example: 2450
 *                     percentile:
 *                       type: number
 *                       example: 78.5
 *                       description: "Percentage of users with lower XP"
 *                     nearbyRanks:
 *                       type: array
 *                       description: "Players ranked around current user"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
