import { StatusCodes } from 'http-status-codes'
import { challengeService } from '~/services/challengeService'
import XpService from '~/services/xpService'
import GamificationService from '~/services/gamificationService'
import { emitChallengeCreated, emitChallengeParticipant } from '~/utils/challengeSocketEmitter'

// Create new challenge (post)
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const imageFile = req.file || null

    const challenge = await challengeService.createNew(userId, req.body, imageFile)

    // Emit socket event to notify all users about new challenge
    emitChallengeCreated(challenge)

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

    // Emit socket event only if this is a new participant
    if (result.isNewParticipant) {
      const participant = {
        userId: result.newComment.userId,
        userDisplayName: result.newComment.userDisplayName,
        userAvatar: result.newComment.userAvatar
      }
      emitChallengeParticipant(result.challenge, participant, result.challenge.createdBy)
    }

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
    const userId = req.jwtDecoded._id.toString()
    const { id } = req.params
    console.log(`🎯 Join challenge request - userId: ${userId}, challengeId: ${id}`)

    // Fetch challenge to check if user is the creator
    const challenge = await challengeService.getDetails(id, userId)
    console.log(`📌 Challenge found - createdBy: ${challenge.createdBy}, userId: ${userId}`)
    
    // Only award XP if user is NOT the challenge creator
    let xpResult = null
    const creatorIdStr = challenge.createdBy.toString ? challenge.createdBy.toString() : challenge.createdBy
    
    if (creatorIdStr !== userId) {
      console.log(`✅ User is NOT creator - will award XP`)
      try {
        xpResult = await GamificationService.awardJoinChallengeXp(userId, id)
        console.log(`✅ XP awarded to ${userId} for joining challenge ${id}`)
      } catch (error) {
        // XP award failed (already joined) but join still counts
        console.warn('⚠️ XP award failed:', error.message)
      }
    } else {
      console.log(`❌ User IS creator - will NOT award XP`)
    }

    // Fetch the updated garden to return to frontend
    let updatedGarden = null
    try {
      updatedGarden = await GamificationService.getUserGarden(userId)
      console.log(`🌳 Fetched garden - level: ${updatedGarden.level}, currentXp: ${updatedGarden.currentXp}, treeStage: ${updatedGarden.treeStage}`)
    } catch (err) {
      console.error('Error fetching updated garden:', err.message)
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: xpResult ? `Joined challenge! +${xpResult.xpGained} XP` : 'Joined challenge!',
      data: updatedGarden || null,
      xpReward: xpResult
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
