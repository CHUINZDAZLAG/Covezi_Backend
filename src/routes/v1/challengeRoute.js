import express from 'express'
import { challengeController } from '~/controllers/challengeController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Challenges
 *   description: Environmental challenges and gamification endpoints
 */

// ==================== DEBUG ROUTE ====================
/**
 * @swagger
 * /v1/challenges/debug/count:
 *   get:
 *     summary: Debug - Get total challenge count
 *     tags: [Challenges]
 *     responses:
 *       200:
 *         description: Challenge count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalChallenges:
 *                   type: integer
 *                   example: 25
 *                 timestamp:
 *                   type: string
 *                   example: "2023-12-03T10:00:00.000Z"
 */
Router.route('/debug/count')
  .get(async (req, res) => {
    try {
      const { GET_DB } = await import('~/config/mongodb')
      const count = await GET_DB().collection('challenges').countDocuments({ _destroy: false })
      res.json({ totalChallenges: count, timestamp: new Date() })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

// ==================== CHALLENGE ROUTES ====================

/**
 * @swagger
 * /v1/challenges/featured:
 *   get:
 *     summary: Get featured challenges
 *     tags: [Challenges]
 *     responses:
 *       200:
 *         description: Featured challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 */
// GET /v1/challenges/featured - Get featured challenges (MUST be before /:id)
Router.route('/featured')
  .get(challengeController.getFeatured)

/**
 * @swagger
 * /v1/challenges:
 *   get:
 *     summary: Get all challenges with filtering and pagination
 *     tags: [Challenges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of challenges per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, DRAFT]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ECO_ACTION, AWARENESS, COMMUNITY]
 *         description: Filter by type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, popular, ending_soon, trending]
 *         description: Sort challenges
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in challenge titles
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenges:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Challenge'
 *                         totalChallenges:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *   post:
 *     summary: Create new challenge
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *                 example: Plant 5 Trees Challenge
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: Plant 5 trees in your local area and share photos as proof
 *               type:
 *                 type: string
 *                 enum: [ECO_ACTION, AWARENESS, COMMUNITY]
 *                 default: ECO_ACTION
 *               durationDays:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 30
 *                 default: 7
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["planting", "environment", "trees"]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Challenge cover image
 *     responses:
 *       201:
 *         description: Challenge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 */
// GET /v1/challenges - Get all challenges (feed)
// POST /v1/challenges - Create new challenge (auth required)
Router.route('/')
  .get(authMiddleware.isAuthorizedOptional, challengeController.getMany)
  .post(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingle('image'),
    challengeController.createNew
  )

/**
 * @swagger
 * /v1/challenges/my:
 *   get:
 *     summary: Get challenges user participated in
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User participations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenges:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Challenge'
 */
// GET /v1/challenges/my - Get user's participated challenges (MUST be before /:id)
Router.route('/my')
  .get(authMiddleware.isAuthorized, challengeController.getUserParticipations)

/**
 * @swagger
 * /v1/challenges/created:
 *   get:
 *     summary: Get challenges created by current user
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Created challenges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 */
// GET /v1/challenges/created - Get challenges created by current user (MUST be before /:id)
Router.route('/created')
  .get(authMiddleware.isAuthorized, challengeController.getMyCreatedChallenges)

/**
 * @swagger
 * /v1/challenges/{id}:
 *   get:
 *     summary: Get challenge details by ID
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Comments page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Comments per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, popular]
 *         description: Sort comments
 *     responses:
 *       200:
 *         description: Challenge details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Challenge'
 *                         - type: object
 *                           properties:
 *                             comments:
 *                               type: array
 *                               description: Paginated proof comments
 *                             totalComments:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             currentPage:
 *                               type: integer
 *   put:
 *     summary: Update challenge (Creator only)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Challenge updated successfully
 *   delete:
 *     summary: Delete challenge (Creator only)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge deleted successfully
 */
// GET /v1/challenges/:id - Get challenge details
// PUT /v1/challenges/:id - Update challenge
// DELETE /v1/challenges/:id - Delete challenge
Router.route('/:id')
  .get(authMiddleware.isAuthorizedOptional, challengeController.getDetails)
  .put(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingle('image'),
    challengeController.update
  )
  .delete(authMiddleware.isAuthorized, challengeController.deleteItem)

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /v1/challenges/{id}/like:
 *   post:
 *     summary: Like a challenge (Earns +5 XP, max 5 likes per day)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     responses:
 *       200:
 *         description: Challenge liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenge:
 *                           $ref: '#/components/schemas/Challenge'
 *                         pointsEarned:
 *                           type: integer
 *                           example: 5
 *                         becameTrending:
 *                           type: boolean
 *   delete:
 *     summary: Unlike a challenge
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge unliked successfully
 */
// POST /v1/challenges/:id/like - Like a challenge
// DELETE /v1/challenges/:id/like - Unlike a challenge
Router.route('/:id/like')
  .post(authMiddleware.isAuthorized, challengeController.likeChallenge)
  .delete(authMiddleware.isAuthorized, challengeController.unlikeChallenge)

// ==================== COMMENT (PROOF) ROUTES ====================

/**
 * @swagger
 * /v1/challenges/{id}/comments:
 *   post:
 *     summary: Add proof comment to participate in challenge (Earns +30 XP)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: I planted 3 oak trees in the local park today!
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Proof image/video
 *               mediaType:
 *                 type: string
 *                 enum: [image, video_embed]
 *                 default: image
 *               platform:
 *                 type: string
 *                 enum: [tiktok, youtube]
 *                 description: Video platform (for video_embed)
 *     responses:
 *       201:
 *         description: Proof comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenge:
 *                           $ref: '#/components/schemas/Challenge'
 *                         pointsEarned:
 *                           type: integer
 *                           example: 30
 *                         isNewParticipant:
 *                           type: boolean
 *                         becameTrending:
 *                           type: boolean
 */
// POST /v1/challenges/:id/comments - Add proof comment (participate)
Router.route('/:id/comments')
  .post(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingle('media'),
    challengeController.addProofComment
  )

/**
 * @swagger
 * /v1/challenges/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete proof comment (Comment owner only)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 */
// DELETE /v1/challenges/:id/comments/:commentId - Delete proof comment
Router.route('/:id/comments/:commentId')
  .delete(authMiddleware.isAuthorized, challengeController.deleteProofComment)

/**
 * @swagger
 * /v1/challenges/{id}/comments/{commentId}/like:
 *   post:
 *     summary: Like a proof comment (Comment owner earns +1 XP)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenge:
 *                           $ref: '#/components/schemas/Challenge'
 *                         pointsForOwner:
 *                           type: integer
 *                           example: 1
 *   delete:
 *     summary: Unlike a proof comment
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment unliked successfully
 */
// POST /v1/challenges/:id/comments/:commentId/like - Like a comment
// DELETE /v1/challenges/:id/comments/:commentId/like - Unlike a comment
Router.route('/:id/comments/:commentId/like')
  .post(authMiddleware.isAuthorized, challengeController.likeComment)
  .delete(authMiddleware.isAuthorized, challengeController.unlikeComment)

// ==================== LEADERBOARD ====================

/**
 * @swagger
 * /v1/challenges/{id}/leaderboard:
 *   get:
 *     summary: Get challenge leaderboard (Top participants by points)
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top participants
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           userDisplayName:
 *                             type: string
 *                           userAvatar:
 *                             type: string
 *                           totalPoints:
 *                             type: integer
 *                           commentsCount:
 *                             type: integer
 *                           rank:
 *                             type: integer
 */
// GET /v1/challenges/:id/leaderboard - Get challenge leaderboard
Router.route('/:id/leaderboard')
  .get(challengeController.getLeaderboard)

// ==================== XP REWARD ROUTES ====================

/**
 * @swagger
 * /v1/challenges/daily-login:
 *   post:
 *     summary: Claim daily login reward (Earns +5 XP, once per day)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily login reward claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         xpEarned:
 *                           type: integer
 *                           example: 5
 *                         streak:
 *                           type: integer
 *                           example: 3
 *                         leveledUp:
 *                           type: boolean
 *                         newLevel:
 *                           type: integer
 *       400:
 *         description: Already claimed today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /v1/challenges/daily-login - Claim daily login reward
Router.route('/daily-login')
  .post(authMiddleware.isAuthorized, challengeController.claimDailyLogin)

/**
 * @swagger
 * /v1/challenges/{id}/join:
 *   post:
 *     summary: Join a challenge (Award +20 XP, once per challenge)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     responses:
 *       200:
 *         description: Challenge joined successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         xpEarned:
 *                           type: integer
 *                           example: 20
 *                         leveledUp:
 *                           type: boolean
 *                         newLevel:
 *                           type: integer
 *       400:
 *         description: Already joined or challenge ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /v1/challenges/:id/join - Join a challenge (award +20 XP)
Router.route('/:id/join')
  .post(authMiddleware.isAuthorized, challengeController.joinChallenge)

export const challengeRoute = Router
