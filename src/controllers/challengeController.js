import { StatusCodes } from 'http-status-codes'
import { challengeService } from '~/services/challengeService'
import XpService from '~/services/xpService'

// Create new challenge (post)
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const imageFile = req.file || null

    const challenge = await challengeService.createNew(userId, req.body, imageFile)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Get challenge details with comments
const getDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.jwtDecoded?._id || null

    const challenge = await challengeService.getDetails(id, userId, req.query)

    res.status(StatusCodes.OK).json({
      success: true,
      data: challenge
    })
  } catch (error) { next(error) }
}

// Get all challenges (feed)
const getMany = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id || null
    const result = await challengeService.getMany(req.query, userId)

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) { next(error) }
}

// Get featured challenges
const getFeatured = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6
    const challenges = await challengeService.getFeatured(limit)

    res.status(StatusCodes.OK).json({
      success: true,
      data: challenges
    })
  } catch (error) { next(error) }
}

// Like a challenge
const likeChallenge = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id } = req.params

    const challenge = await challengeService.likeChallenge(id, userId)

    // Award XP for liking challenge (+2 XP, max 5 per day)
    let xpReward = null
    try {
      xpReward = await XpService.awardLikeChallengeXp(userId, id)
    } catch (error) {
      // XP award failed (max daily limit reached) but like still counts
      console.warn('XP award failed:', error.message)
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: xpReward ? `Liked! +${xpReward.xpAmount} XP (${xpReward.likeNumber}/5 today)` : 'Liked!',
      data: challenge,
      xpReward
    })
  } catch (error) { next(error) }
}

// Unlike a challenge
const unlikeChallenge = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id } = req.params

    const challenge = await challengeService.unlikeChallenge(id, userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Unliked',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Add proof comment (participate in challenge)
const addProofComment = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id } = req.params
    const mediaFile = req.file || null

    const result = await challengeService.addProofComment(id, userId, req.body, mediaFile)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Proof submitted! +${result.pointsEarned} points`,
      data: {
        challenge: result.challenge,
        comment: result.newComment,
        pointsEarned: result.pointsEarned,
        isNewParticipant: result.isNewParticipant
      }
    })
  } catch (error) { next(error) }
}

// Delete proof comment
const deleteProofComment = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id, commentId } = req.params

    const challenge = await challengeService.deleteProofComment(id, commentId, userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Comment deleted',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Like a comment
const likeComment = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id, commentId } = req.params

    const challenge = await challengeService.likeComment(id, commentId, userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Liked comment',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Unlike a comment
const unlikeComment = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id, commentId } = req.params

    const challenge = await challengeService.unlikeComment(id, commentId, userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Unliked comment',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Get user's participated challenges
const getUserParticipations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const result = await challengeService.getUserParticipations(userId, req.query)

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) { next(error) }
}

// Get challenges created by current user
const getMyCreatedChallenges = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const result = await challengeService.getUserCreatedChallenges(userId, req.query)

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) { next(error) }
}

// Update challenge
const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const isAdmin = req.jwtDecoded.role === 'admin'
    const { id } = req.params
    const imageFile = req.file || null

    const challenge = await challengeService.update(id, userId, isAdmin, req.body, imageFile)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Challenge updated successfully',
      data: challenge
    })
  } catch (error) { next(error) }
}

// Delete challenge
const deleteItem = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const isAdmin = req.jwtDecoded.role === 'admin'
    const { id } = req.params

    await challengeService.deleteItem(id, userId, isAdmin)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Challenge deleted successfully'
    })
  } catch (error) { next(error) }
}

// Get leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit) || 10

    const leaderboard = await challengeService.getLeaderboard(id, limit)

    res.status(StatusCodes.OK).json({
      success: true,
      data: leaderboard
    })
  } catch (error) { next(error) }
}

// Join a challenge
const joinChallenge = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id } = req.params

    // Award XP for joining challenge (+20 XP, once per challenge)
    let xpReward = null
    try {
      xpReward = await XpService.awardJoinChallengeXp(userId, id)
    } catch (error) {
      // XP award failed (already joined) but join still counts
      console.warn('XP award failed:', error.message)
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: xpReward ? `Joined challenge! +${xpReward.xpAmount} XP` : 'Joined challenge!',
      xpReward
    })
  } catch (error) { next(error) }
}

// Claim daily login reward
const claimDailyLogin = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const result = await XpService.claimDailyLoginXp(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: result
    })
  } catch (error) { next(error) }
}

export const challengeController = {
  createNew,
  getDetails,
  getMany,
  getFeatured,
  likeChallenge,
  unlikeChallenge,
  addProofComment,
  deleteProofComment,
  likeComment,
  unlikeComment,
  getUserParticipations,
  getMyCreatedChallenges,
  update,
  deleteItem,
  getLeaderboard,
  joinChallenge,
  claimDailyLogin
}
