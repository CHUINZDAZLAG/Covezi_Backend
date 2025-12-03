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
 *         description: ❌ Authentication required
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
 *                   example: "Authentication required. Please login."
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

/**
 * @swagger
 * /v1/gamification/join-challenge:
 *   post:
 *     tags: [Gamification]
 *     summary: 🎯 Join environmental challenge
 *     description: Join a challenge to earn +10 XP bonus
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengeId
 *             properties:
 *               challengeId:
 *                 type: string
 *                 description: ID of challenge to join
 *                 example: "674f1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: ✅ Challenge joined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Challenge joined! +10 XP earned"
 *                 data:
 *                   type: object
 *                   properties:
 *                     xpGained:
 *                       type: number
 *                       example: 10
 *                     newTotalXP:
 *                       type: number
 *                       example: 2460
 *                     challengeInfo:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/join-challenge', authMiddleware.isAuthorized, GamificationController.joinChallenge)

/**
 * @swagger
 * /v1/gamification/complete-challenge:
 *   post:
 *     tags: [Gamification]
 *     summary: 🏆 Complete challenge
 *     description: Mark challenge as completed to earn +20 XP reward
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengeId
 *             properties:
 *               challengeId:
 *                 type: string
 *                 example: "674f1234567890abcdef1234"
 *               proof:
 *                 type: string
 *                 description: Optional completion proof/description
 *                 example: "Completed 7 days of zero waste living!"
 *     responses:
 *       200:
 *         description: ✅ Challenge completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Challenge completed! +20 XP earned"
 *                 data:
 *                   type: object
 *                   properties:
 *                     xpGained:
 *                       type: number
 *                       example: 20
 *                     bonusXP:
 *                       type: number
 *                       example: 5
 *                     newLevel:
 *                       type: number
 *                     achievements:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/complete-challenge', authMiddleware.isAuthorized, GamificationController.completeChallenge)

/**
 * @swagger
 * /v1/gamification/creator-bonus:
 *   post:
 *     tags: [Gamification]
 *     summary: 🌟 Award creator bonus
 *     description: Award +30 XP bonus to challenge creator when challenge has >10 participants
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengeId
 *             properties:
 *               challengeId:
 *                 type: string
 *                 example: "674f1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: ✅ Creator bonus awarded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Creator bonus awarded! +30 XP for popular challenge"
 *                 data:
 *                   type: object
 *                   properties:
 *                     xpGained:
 *                       type: number
 *                       example: 30
 *                     participantCount:
 *                       type: number
 *                       example: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @swagger
 * /v1/gamification/admin/config:
 *   get:
 *     tags: [Gamification]
 *     summary: 🔧 Get gamification config (Admin)
 *     description: Get current gamification system configuration
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ Config retrieved
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
 *                     xpRates:
 *                       type: object
 *                       properties:
 *                         dailyLogin:
 *                           type: number
 *                           example: 5
 *                         challengeJoin:
 *                           type: number
 *                           example: 10
 *                         challengeComplete:
 *                           type: number
 *                           example: 20
 *                     levelRequirements:
 *                       type: array
 *                       items:
 *                         type: number
 *                     voucherTiers:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   put:
 *     tags: [Gamification]
 *     summary: 🛠️ Update gamification config (Admin)
 *     description: Update system configuration settings
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               xpRates:
 *                 type: object
 *                 properties:
 *                   dailyLogin:
 *                     type: number
 *                     example: 5
 *                   challengeJoin:
 *                     type: number
 *                     example: 10
 *                   challengeComplete:
 *                     type: number
 *                     example: 25
 *               levelRequirements:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [100, 250, 500, 1000, 2000]
 *     responses:
 *       200:
 *         description: ✅ Config updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/config', authMiddleware.isAuthorized, GamificationController.getConfig)
router.put('/admin/config', authMiddleware.isAuthorized, GamificationController.updateConfig)

/**
 * @swagger
 * /v1/gamification/admin/voucher-tier:
 *   put:
 *     tags: [Gamification]
 *     summary: 🎁 Update voucher tier (Admin)
 *     description: Update voucher tier configuration for level rewards
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - voucherType
 *               - value
 *             properties:
 *               level:
 *                 type: number
 *                 example: 10
 *               voucherType:
 *                 type: string
 *                 enum: [discount_percentage, discount_fixed, free_shipping]
 *                 example: "discount_percentage"
 *               value:
 *                 type: number
 *                 example: 15
 *               description:
 *                 type: string
 *                 example: "15% discount for reaching level 10"
 *     responses:
 *       200:
 *         description: ✅ Voucher tier updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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
