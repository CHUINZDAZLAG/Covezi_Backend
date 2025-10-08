import express from 'express'
import { challengeController } from '~/controllers/challengeController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

// ==================== DEBUG ROUTE ====================
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

// GET /v1/challenges/featured - Get featured challenges (MUST be before /:id)
Router.route('/featured')
  .get(challengeController.getFeatured)

// GET /v1/challenges - Get all challenges (feed)
// POST /v1/challenges - Create new challenge (auth required)
Router.route('/')
  .get(authMiddleware.isAuthorizedOptional, challengeController.getMany)
  .post(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingle('image'),
    challengeController.createNew
  )

// GET /v1/challenges/my - Get user's participated challenges (MUST be before /:id)
Router.route('/my')
  .get(authMiddleware.isAuthorized, challengeController.getUserParticipations)

// GET /v1/challenges/created - Get challenges created by current user (MUST be before /:id)
Router.route('/created')
  .get(authMiddleware.isAuthorized, challengeController.getMyCreatedChallenges)

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

// POST /v1/challenges/:id/like - Like a challenge
// DELETE /v1/challenges/:id/like - Unlike a challenge
Router.route('/:id/like')
  .post(authMiddleware.isAuthorized, challengeController.likeChallenge)
  .delete(authMiddleware.isAuthorized, challengeController.unlikeChallenge)

// ==================== COMMENT (PROOF) ROUTES ====================

// POST /v1/challenges/:id/comments - Add proof comment (participate)
Router.route('/:id/comments')
  .post(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingle('media'),
    challengeController.addProofComment
  )

// DELETE /v1/challenges/:id/comments/:commentId - Delete proof comment
Router.route('/:id/comments/:commentId')
  .delete(authMiddleware.isAuthorized, challengeController.deleteProofComment)

// POST /v1/challenges/:id/comments/:commentId/like - Like a comment
// DELETE /v1/challenges/:id/comments/:commentId/like - Unlike a comment
Router.route('/:id/comments/:commentId/like')
  .post(authMiddleware.isAuthorized, challengeController.likeComment)
  .delete(authMiddleware.isAuthorized, challengeController.unlikeComment)

// ==================== LEADERBOARD ====================

// GET /v1/challenges/:id/leaderboard - Get challenge leaderboard
Router.route('/:id/leaderboard')
  .get(challengeController.getLeaderboard)

// ==================== XP REWARD ROUTES ====================

// POST /v1/challenges/daily-login - Claim daily login reward
Router.route('/daily-login')
  .post(authMiddleware.isAuthorized, challengeController.claimDailyLogin)

// POST /v1/challenges/:id/join - Join a challenge (award +20 XP)
Router.route('/:id/join')
  .post(authMiddleware.isAuthorized, challengeController.joinChallenge)

export const challengeRoute = Router
