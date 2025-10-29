import { challengeModel, POINTS_CONFIG } from '~/models/challengeModel'
import { gardenModel } from '~/models/gardenModel'
import { userModel } from '~/models/userModel'
import { UserGarden } from '~/models/gamificationModel.js'
import GamificationService from '~/services/gamificationService.js'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Create new challenge (post)
const createNew = async (userId, reqBody, imageFile) => {
  try {
    const user = await userModel.findOneById(userId)
    
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    let imageUrl = ''
    if (imageFile) {
      try {
        const uploadResult = await CloudinaryProvider.streamUpload(imageFile.buffer, 'challenges')
        imageUrl = uploadResult.secure_url
      } catch (uploadErr) {
        console.error('[challengeService.createNew] Cloudinary upload failed:', uploadErr?.message)
        if (uploadErr?.message?.includes('timeout') || uploadErr?.statusCode === 504) {
          throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'Image upload timed out. Please try again with a smaller file.')
        }
        if (uploadErr?.message?.includes('ECONNRESET') || uploadErr?.message?.includes('ETIMEDOUT')) {
          throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Network error during upload. Please check your connection and try again.')
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Upload failed: ${uploadErr?.message || 'Unknown error'}`)
      }
    }

    const durationDays = parseInt(reqBody.durationDays) || 7
    if (durationDays < 3 || durationDays > 30) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Duration must be between 3 and 30 days')
    }

    // Parse tags if provided as string
    let tags = []
    if (reqBody.tags) {
      tags = typeof reqBody.tags === 'string'
        ? reqBody.tags.split(',').map(t => t.trim()).filter(t => t)
        : reqBody.tags
    }

    const challengeData = {
      title: reqBody.title,
      description: reqBody.description,
      type: reqBody.type || 'eco-action',
      tags: tags,
      durationDays: durationDays,
      image: imageUrl,
      createdBy: userId,
      creatorDisplayName: user.displayName,
      creatorAvatar: user.avatar || null,
      isOfficial: user.role === 'admin' && reqBody.isOfficial === 'true',
      featured: user.role === 'admin' && reqBody.featured === 'true'
    }

    console.log('[challengeService.createNew] Creating challenge:', { title: challengeData.title, createdBy: userId })

    const createdChallenge = await challengeModel.createNew(challengeData)
    const challenge = await challengeModel.findOneById(createdChallenge.insertedId)

    console.log('[challengeService.createNew] Created challenge:', { id: challenge._id, status: challenge.status, endDate: new Date(challenge.endDate) })

    return challenge
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error('[challengeService.createNew] Error:', error?.message)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error?.message || 'Failed to create challenge')
  }
}

// Get challenge details with comments
const getDetails = async (challengeId, userId = null, query = {}) => {
  try {
    const challenge = await challengeModel.getDetails(challengeId, query)
    if (!challenge) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found')
    }

    // Add user interaction status if userId provided
    if (userId) {
      challenge.isLiked = challenge.likes.some(l => l.userId === userId)
      challenge.hasParticipated = await challengeModel.hasParticipated(challengeId, userId)
    }

    // Calculate time remaining
    const now = Date.now()
    if (challenge.endDate > now) {
      challenge.timeRemaining = challenge.endDate - now
      challenge.daysRemaining = Math.ceil(challenge.timeRemaining / (24 * 60 * 60 * 1000))
    } else {
      challenge.timeRemaining = 0
      challenge.daysRemaining = 0
    }

    return challenge
  } catch (error) {
    throw error
  }
}

// Get all challenges (for feed)
const getMany = async (query, userId = null) => {
  try {
    const queryObj = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      status: query.status,
      type: query.type,
      tag: query.tag,
      featured: query.featured,
      isOfficial: query.isOfficial,
      search: query.search,
      sortBy: query.sortBy || 'newest',
      includeExpired: query.includeExpired === 'true'
    }

    console.log('[challengeService.getMany] Query params:', queryObj)

    let result
    try {
      result = await challengeModel.getAllChallenges(queryObj)
    } catch (err) {
      // Graceful error handling for Mongo pool cleared / TLS issues
      const msg = String(err?.message || '')
      console.error('[challengeService.getMany] Error:', msg)
      if (msg.includes('MongoPoolClearedError') || msg.includes('SSL routines') || msg.includes('tlsv1 alert internal error')) {
        throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Service temporarily unavailable. Please try again in a moment.')
      }
      throw err
    }

    console.log('[challengeService.getMany] Got result:', { count: result.challenges.length, total: result.totalChallenges })

    // Add time remaining and user interaction status
    const now = Date.now()
    result.challenges = result.challenges.map(challenge => {
      const enriched = {
        ...challenge,
        timeRemaining: challenge.endDate > now ? challenge.endDate - now : 0,
        daysRemaining: challenge.endDate > now
          ? Math.ceil((challenge.endDate - now) / (24 * 60 * 60 * 1000))
          : 0
      }

      if (userId) {
        enriched.isLiked = challenge.likes.some(l => l.userId === userId)
        enriched.hasParticipated = challenge.comments.some(c => c.userId === userId && !c._destroy)
      }

      return enriched
    })

    return result
  } catch (error) {
    throw error
  }
}

// Get featured challenges
const getFeatured = async (limit = 6) => {
  try {
    const result = await challengeModel.getAllChallenges({
      featured: 'true',
      limit: limit,
      sortBy: 'trending'
    })
    return result.challenges
  } catch (error) {
    throw error
  }
}

// Like a challenge
const likeChallenge = async (challengeId, userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const result = await challengeModel.likeChallenge(challengeId, {
      userId: userId,
      userDisplayName: user.displayName
    })

    // Add points to user's garden
    await addGardenPoints(userId, result.pointsEarned, 'like_challenge')

    // If became trending, give bonus to challenge creator
    if (result.becameTrending) {
      const challenge = result.challenge
      await addGardenPoints(challenge.createdBy, POINTS_CONFIG.TRENDING_BONUS, 'trending_bonus')
    }

    return result.challenge
  } catch (error) {
    if (error.message.includes('Already liked')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Already liked this challenge')
    }
    throw error
  }
}

// Unlike a challenge
const unlikeChallenge = async (challengeId, userId) => {
  try {
    const result = await challengeModel.unlikeChallenge(challengeId, userId)
    return result
  } catch (error) {
    if (error.message.includes('Not liked')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Not liked yet')
    }
    throw error
  }
}

// Add proof comment (participate in challenge)
const addProofComment = async (challengeId, userId, reqBody, mediaFile) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Prepare media data
    let media = null
    if (mediaFile) {
      try {
        // Upload to Cloudinary with error handling
        const uploadResult = await CloudinaryProvider.streamUpload(mediaFile.buffer, 'challenge-proofs')
        media = {
          type: 'image',
          url: uploadResult.secure_url,
          thumbnailUrl: null,
          platform: null
        }
      } catch (uploadErr) {
        console.error('[challengeService.addProofComment] Cloudinary upload failed:', uploadErr?.message)
        // Check if it's a timeout error
        if (uploadErr?.message?.includes('timeout') || uploadErr?.statusCode === 504) {
          throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'Image upload timed out. Please try again with a smaller file.')
        }
        // Check for network errors
        if (uploadErr?.message?.includes('ECONNRESET') || uploadErr?.message?.includes('ETIMEDOUT')) {
          throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Network error during upload. Please check your connection and try again.')
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Upload failed: ${uploadErr?.message || 'Unknown error'}`)
      }
    } else if (reqBody.videoUrl) {
      // Video embed (TikTok/YouTube)
      const platform = detectVideoPlatform(reqBody.videoUrl)
      media = {
        type: 'video_embed',
        url: reqBody.videoUrl,
        thumbnailUrl: reqBody.thumbnailUrl || null,
        platform: platform
      }
    } else if (reqBody.content) {
      // Text only
      media = {
        type: 'text',
        url: '',
        thumbnailUrl: null,
        platform: null
      }
    }

    const commentData = {
      userId: userId,
      userDisplayName: user.displayName,
      userAvatar: user.avatar || null,
      content: reqBody.content || '',
      media: media
    }

    const result = await challengeModel.addProofComment(challengeId, commentData)

    // Add points to user's garden (only if points earned > 0, i.e., first participation)
    if (result.pointsEarned > 0) {
      console.log(`[addProofComment] User ${userId} earned ${result.pointsEarned} XP for first participation in challenge ${challengeId}`)
      await addGardenPoints(userId, result.pointsEarned, 'submit_proof')
    } else {
      console.log(`[addProofComment] User ${userId} already participated, no XP awarded for this comment on challenge ${challengeId}`)
    }

    // If became trending (>10 participants), give bonus to challenge creator
    if (result.becameTrending) {
      const challenge = result.challenge
      console.log(`[addProofComment] Challenge ${challengeId} reached >10 participants! Creator ${challenge.createdBy} receives ${POINTS_CONFIG.TRENDING_BONUS} XP bonus`)
      await addGardenPoints(challenge.createdBy, POINTS_CONFIG.TRENDING_BONUS, 'trending_bonus')
    }

    return {
      challenge: result.challenge,
      newComment: result.newComment,
      pointsEarned: result.pointsEarned,
      isNewParticipant: result.isNewParticipant
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error.message.includes('not active')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Challenge is not active')
    }
    if (error.message.includes('has ended')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Challenge has ended')
    }
    // Log unexpected errors
    console.error('[challengeService.addProofComment] Unexpected error:', error?.message)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to submit proof: ' + (error?.message || 'Unknown error'))
  }
}

// Delete proof comment
const deleteProofComment = async (challengeId, commentId, userId) => {
  try {
    const result = await challengeModel.deleteProofComment(challengeId, commentId, userId)
    return result
  } catch (error) {
    if (error.message.includes('Not authorized')) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this comment')
    }
    throw error
  }
}

// Like a comment
const likeComment = async (challengeId, commentId, userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const result = await challengeModel.likeComment(challengeId, commentId, {
      userId: userId,
      userDisplayName: user.displayName
    })

    // Add points to comment owner's garden
    if (result.commentOwnerId !== userId) {
      await addGardenPoints(result.commentOwnerId, result.pointsForOwner, 'receive_like')
    }

    return result.challenge
  } catch (error) {
    if (error.message.includes('Already liked')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Already liked this comment')
    }
    throw error
  }
}

// Unlike a comment
const unlikeComment = async (challengeId, commentId, userId) => {
  try {
    const result = await challengeModel.unlikeComment(challengeId, commentId, userId)
    return result
  } catch (error) {
    if (error.message.includes('Not liked')) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Not liked yet')
    }
    throw error
  }
}

// Get user's participated challenges
const getUserParticipations = async (userId, query) => {
  try {
    const result = await challengeModel.getUserParticipatedChallenges(userId, query)
    return result
  } catch (error) {
    throw error
  }
}

// Get challenges created by user
const getUserCreatedChallenges = async (userId, query) => {
  try {
    const result = await challengeModel.getChallengesByCreator(userId, query)
    return result
  } catch (error) {
    throw error
  }
}

// Update challenge (only creator or admin)
const update = async (challengeId, userId, isAdmin, updateData, imageFile) => {
  try {
    const challenge = await challengeModel.findOneById(challengeId)
    if (!challenge) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found')
    }

    if (!isAdmin && challenge.createdBy !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to update this challenge')
    }

    if (imageFile) {
      try {
        const uploadResult = await CloudinaryProvider.streamUpload(imageFile.buffer, 'challenges')
        updateData.image = uploadResult.secure_url
      } catch (uploadErr) {
        console.error('[challengeService.update] Cloudinary upload failed:', uploadErr?.message)
        if (uploadErr?.message?.includes('timeout') || uploadErr?.statusCode === 504) {
          throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'Image upload timed out. Please try again with a smaller file.')
        }
        if (uploadErr?.message?.includes('ECONNRESET') || uploadErr?.message?.includes('ETIMEDOUT')) {
          throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Network error during upload. Please check your connection and try again.')
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Upload failed: ${uploadErr?.message || 'Unknown error'}`)
      }
    }

    // Parse tags if provided
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(t => t)
    }

    // Admin-only fields
    if (!isAdmin) {
      delete updateData.isOfficial
      delete updateData.featured
    }

    const updatedChallenge = await challengeModel.update(challengeId, updateData)
    return updatedChallenge
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error('[challengeService.update] Error:', error?.message)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error?.message || 'Failed to update challenge')
  }
}

// Delete challenge (user can delete own, admin can delete any)
const deleteItem = async (challengeId, userId, isAdmin) => {
  try {
    const challenge = await challengeModel.findOneById(challengeId)
    if (!challenge) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found')
    }

    if (!isAdmin && challenge.createdBy !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this challenge')
    }

    await challengeModel.deleteOneById(challengeId)

    return { deleted: true }
  } catch (error) {
    throw error
  }
}

// Get leaderboard for a challenge (top contributors)
const getLeaderboard = async (challengeId, limit = 10) => {
  try {
    const challenge = await challengeModel.findOneById(challengeId)
    if (!challenge) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found')
    }

    // Aggregate points by user from comments
    const userPoints = {}
    challenge.comments.forEach(comment => {
      if (!comment._destroy) {
        if (!userPoints[comment.userId]) {
          userPoints[comment.userId] = {
            userId: comment.userId,
            userDisplayName: comment.userDisplayName,
            userAvatar: comment.userAvatar,
            totalPoints: 0,
            commentCount: 0
          }
        }
        userPoints[comment.userId].totalPoints += comment.pointsEarned
        userPoints[comment.userId].commentCount++
      }
    })

    // Sort and limit
    const leaderboard = Object.values(userPoints)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }))

    return {
      challengeId: challenge._id,
      challengeTitle: challenge.title,
      leaderboard
    }
  } catch (error) {
    throw error
  }
}

// Helper function to add points to garden
const addGardenPoints = async (userId, points, action) => {
  try {
    console.log(`[addGardenPoints] Adding ${points} XP to user ${userId} for action: ${action}`)
    
    // Use GamificationService to add XP (Mongoose UserGarden model)
    // This is what the frontend reads from
    const result = await GamificationService.addXp(userId, points, action)
    console.log(`[addGardenPoints] XP added successfully. New level: ${result.newLevel}, Current XP: ${result.currentXp}, Next Level XP: ${result.nextLevelXp}`)

    // ALSO update old garden model for backward compatibility
    let garden = await gardenModel.findByUserId(userId)
    if (!garden) {
      await gardenModel.initializeGarden(userId)
      garden = await gardenModel.findByUserId(userId)
    }

    if (garden) {
      await gardenModel.addChallengePoints(userId, points, action)
    }
  } catch (error) {
    console.error('Error adding garden points:', error)
  }
}

// Helper function to detect video platform
const detectVideoPlatform = (url) => {
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook'
  return 'other'
}

export const challengeService = {
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
  getUserCreatedChallenges,
  update,
  deleteItem,
  getLeaderboard
}
