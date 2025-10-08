import { StatusCodes } from 'http-status-codes'
import { challengeService } from '~/services/challengeService'
import ApiError from '~/utils/ApiError'

class AdminChallengeController {
  /**
   * Get all challenges (admin view - no restriction)
   * GET /admin/challenges
   */
  static async getAll(req, res, next) {
    try {
      const result = await challengeService.getMany(req.query, null, true) // isAdmin = true

      res.status(StatusCodes.OK).json({
        success: true,
        data: result
      })
    } catch (error) { next(error) }
  }

  /**
   * Get challenge details (admin can see all info including internal stats)
   * GET /admin/challenges/:id
   */
  static async getDetails(req, res, next) {
    try {
      const { id } = req.params

      const challenge = await challengeService.getDetails(id, null, {}, true) // isAdmin = true

      if (!challenge) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found')
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: challenge
      })
    } catch (error) { next(error) }
  }

  /**
   * Delete challenge (admin can delete any challenge)
   * DELETE /admin/challenges/:id
   */
  static async deleteChallenge(req, res, next) {
    try {
      const { id } = req.params
      const adminId = req.jwtDecoded._id

      await challengeService.deleteItem(id, adminId, true) // isAdmin = true

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Challenge deleted successfully'
      })
    } catch (error) { next(error) }
  }

  /**
   * Get challenge statistics (XP, participation, etc)
   * GET /admin/challenges/stats
   */
  static async getStats(req, res, next) {
    try {
      const stats = await challengeService.getChallengeStats(req.query)

      res.status(StatusCodes.OK).json({
        success: true,
        data: stats
      })
    } catch (error) { next(error) }
  }

  /**
   * Get challenge by creator
   * GET /admin/challenges/creator/:creatorId
   */
  static async getChallengesByCreator(req, res, next) {
    try {
      const { creatorId } = req.params

      const result = await challengeService.getChallengesByCreator(creatorId, req.query)

      res.status(StatusCodes.OK).json({
        success: true,
        data: result
      })
    } catch (error) { next(error) }
  }

  /**
   * Get challenges with low participation (admin needs to promote)
   * GET /admin/challenges/low-participation
   */
  static async getChallengesWithLowParticipation(req, res, next) {
    try {
      const minParticipants = req.query.minParticipants || 5

      const result = await challengeService.getChallengesWithLowParticipation(minParticipants)

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
        message: `Challenges with less than ${minParticipants} participants`
      })
    } catch (error) { next(error) }
  }
}

export const adminChallengeController = AdminChallengeController
