import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminChallengeController } from '~/controllers/adminChallengeController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

// GET /admin/challenges - Get all challenges (with stats)
Router.route('/')
  .get(adminChallengeController.getAll)

// GET /admin/challenges/stats - Get overall challenge statistics
Router.route('/stats')
  .get(adminChallengeController.getStats)

// GET /admin/challenges/low-participation - Get challenges needing promotion
Router.route('/low-participation')
  .get(adminChallengeController.getChallengesWithLowParticipation)

// GET /admin/challenges/creator/:creatorId - Get challenges by creator
Router.route('/creator/:creatorId')
  .get(adminChallengeController.getChallengesByCreator)

// GET /admin/challenges/:id - Get challenge details
// DELETE /admin/challenges/:id - Delete challenge
Router.route('/:id')
  .get(adminChallengeController.getDetails)
  .delete(adminChallengeController.deleteChallenge)

export const adminChallengeRoute = Router
