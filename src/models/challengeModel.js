import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { CHALLENGE_TYPES, CHALLENGE_STATUS } from '~/utils/constants'

// Points configuration for challenge system
export const POINTS_CONFIG = {
  LIKE_CHALLENGE: 5,
  COMMENT_PROOF: 30, // Updated from 20 to 30 as per new specification
  RECEIVE_LIKE_ON_COMMENT: 1,
  TRENDING_BONUS: 50
}

// Media types for proof comments
const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO_EMBED: 'video_embed',
  TEXT: 'text'
}

// Proof Comment schema - User comment để tham gia challenge (bằng chứng)
const PROOF_COMMENT_SCHEMA = Joi.object({
  _id: Joi.string().default(() => new ObjectId().toString()),
  userId: Joi.string().required(),
  userDisplayName: Joi.string().required(),
  userAvatar: Joi.string().allow('', null).default(null),
  content: Joi.string().trim().max(2000).default(''),

  // Media - ảnh/video làm bằng chứng
  media: Joi.object({
    type: Joi.string().valid(...Object.values(MEDIA_TYPES)).required(),
    url: Joi.string().trim().required(),
    thumbnailUrl: Joi.string().trim().allow('', null).default(null),
    platform: Joi.string().valid('tiktok', 'youtube', null).default(null)
  }).allow(null).default(null),

  // Likes trên comment
  likes: Joi.array().items(
    Joi.object({
      userId: Joi.string().required(),
      userDisplayName: Joi.string().required(),
      createdAt: Joi.date().timestamp('javascript').default(Date.now)
    })
  ).default([]),
  likeCount: Joi.number().min(0).default(0),

  // Points earned from this comment
  pointsEarned: Joi.number().min(0).default(0),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Define collection name and schema
const CHALLENGE_COLLECTION_NAME = 'challenges'
const CHALLENGE_COLLECTION_SCHEMA = Joi.object({
  // Basic challenge info - đây là "bài post" về thử thách
  title: Joi.string().required().trim().strict().min(5).max(100),
  description: Joi.string().required().trim().min(10).max(2000),
  type: Joi.string().valid(...Object.values(CHALLENGE_TYPES)).default(CHALLENGE_TYPES.ECO_ACTION),

  // Tags cho challenge
  tags: Joi.array().items(Joi.string().trim()).default([]),

  // Duration: min 3 days, max 30 days
  durationDays: Joi.number().min(3).max(30).default(7),

  // Challenge status and timing
  status: Joi.string().valid(...Object.values(CHALLENGE_STATUS)).default(CHALLENGE_STATUS.ACTIVE),
  startDate: Joi.date().timestamp('javascript').default(Date.now),
  endDate: Joi.date().timestamp('javascript').required(),

  // Grace period: 3 days after end for users to view before auto-delete
  gracePeriodDays: Joi.number().default(3),
  deleteAfter: Joi.date().timestamp('javascript').default(null),

  // Likes trên challenge (như tym bài post)
  likes: Joi.array().items(
    Joi.object({
      userId: Joi.string().required(),
      userDisplayName: Joi.string().required(),
      createdAt: Joi.date().timestamp('javascript').default(Date.now)
    })
  ).default([]),
  likeCount: Joi.number().min(0).default(0),

  // Comments = Proof submissions (người dùng comment để tham gia thử thách)
  comments: Joi.array().items(PROOF_COMMENT_SCHEMA).default([]),
  commentCount: Joi.number().min(0).default(0),

  // Số người đã tham gia (unique users có comment)
  participantCount: Joi.number().min(0).default(0),

  // Media - Challenge cover image/video
  image: Joi.string().trim().default(''),

  // Creator info
  createdBy: Joi.string().required(),
  creatorDisplayName: Joi.string().required(),
  creatorAvatar: Joi.string().allow('', null).default(null),

  // Trending status
  isTrending: Joi.boolean().default(false),
  trendingAt: Joi.date().timestamp('javascript').default(null),

  // Admin/Feature flags
  isOfficial: Joi.boolean().default(false),
  featured: Joi.boolean().default(false),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await CHALLENGE_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const startDate = data.startDate || Date.now()
    const durationDays = data.durationDays || 7
    const gracePeriodDays = data.gracePeriodDays || 3

    const endDate = startDate + (durationDays * 24 * 60 * 60 * 1000)
    const deleteAfter = endDate + (gracePeriodDays * 24 * 60 * 60 * 1000)

    const challengeData = {
      ...data,
      startDate,
      endDate,
      deleteAfter
    }

    const validData = await validateBeforeCreate(challengeData)
    const createdChallenge = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).insertOne(validData)
    return createdChallenge
  } catch (error) { throw new Error(error) }
}

const findOneById = async (challengeId) => {
  try {
    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOne({
      _id: new ObjectId(challengeId),
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

// Get challenges created by a user
const getChallengesByCreator = async (userId, queryObj = {}) => {
  try {
    const query = {
      createdBy: userId,
      _destroy: false
    }

    if (queryObj.status) query.status = queryObj.status

    const challengesPerPage = parseInt(queryObj.limit) || 10
    const page = parseInt(queryObj.page) || 1

    const challenges = await GET_DB()
      .collection(CHALLENGE_COLLECTION_NAME)
      .find(query)
      .project({ comments: { $slice: -3 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * challengesPerPage)
      .limit(challengesPerPage)
      .toArray()

    const totalChallenges = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).countDocuments(query)

    return {
      challenges,
      totalChallenges,
      totalPages: Math.ceil(totalChallenges / challengesPerPage),
      currentPage: page
    }
  } catch (error) { throw new Error(error) }
}

// Get challenges user participated in (has at least 1 comment)
const getUserParticipatedChallenges = async (userId, queryObj = {}) => {
  try {
    const query = {
      'comments.userId': userId,
      _destroy: false
    }

    if (queryObj.status) query.status = queryObj.status

    const challengesPerPage = parseInt(queryObj.limit) || 10
    const page = parseInt(queryObj.page) || 1

    const challenges = await GET_DB()
      .collection(CHALLENGE_COLLECTION_NAME)
      .find(query)
      .project({ comments: { $slice: -3 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * challengesPerPage)
      .limit(challengesPerPage)
      .toArray()

    challenges.forEach(challenge => {
      challenge.userComments = challenge.comments.filter(c => c.userId === userId && !c._destroy)
    })

    const totalChallenges = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).countDocuments(query)

    return {
      challenges,
      totalChallenges,
      totalPages: Math.ceil(totalChallenges / challengesPerPage),
      currentPage: page
    }
  } catch (error) { throw new Error(error) }
}

// Get all active challenges (for feed)
const getAllChallenges = async (queryObj = {}) => {
  try {
    const query = { _destroy: false }

    if (queryObj.status) {
      query.status = queryObj.status
    } else {
      query.status = CHALLENGE_STATUS.ACTIVE
    }

    // TEMPORARY: Disable endDate filter to show all challenges while testing
    // TODO: Re-enable after Node.js upgrade to v20
    if (!queryObj.includeExpired && false) {  // Disabled with 'false' condition
      query.endDate = { $gt: Date.now() }
    }

    if (queryObj.type) query.type = queryObj.type
    if (queryObj.featured === 'true') query.featured = true
    if (queryObj.isOfficial === 'true') query.isOfficial = true
    if (queryObj.tag) query.tags = queryObj.tag

    if (queryObj.search) {
      query.title = { $regex: queryObj.search, $options: 'i' }
    }

    const challengesPerPage = parseInt(queryObj.limit) || 10
    const page = parseInt(queryObj.page) || 1

    let sortOption = { createdAt: -1 }
    if (queryObj.sortBy === 'popular') {
      sortOption = { likeCount: -1, commentCount: -1 }
    } else if (queryObj.sortBy === 'ending_soon') {
      // Only show challenges ending within 3 days
      const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000)
      query.endDate = { $lte: threeDaysFromNow, $gt: Date.now() }
      sortOption = { endDate: 1 }
    } else if (queryObj.sortBy === 'trending') {
      sortOption = { isTrending: -1, likeCount: -1 }
    }

    // Debug logging
    console.log('[getAllChallenges] Query:', JSON.stringify(query))
    console.log('[getAllChallenges] Page:', page, 'Limit:', challengesPerPage)

    // Check total documents in collection (for diagnosis)
    const totalInCollection = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).countDocuments({})
    console.log('[getAllChallenges] Total documents in collection:', totalInCollection)

    // Debug: Check what endDates exist in collection
    if (totalInCollection > 0) {
      const sampleChallenges = await GET_DB()
        .collection(CHALLENGE_COLLECTION_NAME)
        .find({ _destroy: false })
        .limit(3)
        .toArray()
      console.log('[getAllChallenges] Sample challenges endDates:', sampleChallenges.map(c => ({
        title: c.title,
        endDate: new Date(c.endDate),
        status: c.status,
        isExpired: c.endDate < Date.now()
      })))
    }

    const challenges = await GET_DB()
      .collection(CHALLENGE_COLLECTION_NAME)
      .find(query)
      .project({ comments: { $slice: -3 } })
      .sort(sortOption)
      .skip((page - 1) * challengesPerPage)
      .limit(challengesPerPage)
      .toArray()

    const totalChallenges = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).countDocuments(query)

    console.log('[getAllChallenges] Found:', challenges.length, 'Total:', totalChallenges)
    if (challenges.length > 0) {
      console.log('[getAllChallenges] First challenge sample:', { title: challenges[0].title, status: challenges[0].status, endDate: new Date(challenges[0].endDate) })
    }

    return {
      challenges,
      totalChallenges,
      totalPages: Math.ceil(totalChallenges / challengesPerPage),
      currentPage: page
    }
  } catch (error) { 
    console.error('[getAllChallenges] Error:', error?.message)
    throw new Error(error) 
  }
}

// Like a challenge
const likeChallenge = async (challengeId, userData) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    const alreadyLiked = challenge.likes.some(like => like.userId === userData.userId)
    if (alreadyLiked) throw new Error('Already liked this challenge')

    const newLikeCount = challenge.likeCount + 1
    // Dynamic trending criteria based on challenge performance compared to average
    const avgStats = await GET_DB().collection(CHALLENGE_COLLECTION_NAME)
      .aggregate([
        { $match: { endDate: { $gt: Date.now() } } },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: '$likeCount' },
            avgComments: { $avg: '$commentCount' },
            avgParticipants: { $avg: '$participantCount' }
          }
        }
      ]).toArray()

    const thresholds = avgStats[0] || { avgLikes: 10, avgComments: 5, avgParticipants: 5 }
    const shouldBeTrending = (
      newLikeCount > thresholds.avgLikes * 2 && 
      challenge.commentCount > thresholds.avgComments * 1.5 &&
      challenge.participantCount > thresholds.avgParticipants * 1.5 &&
      !challenge.isTrending
    )

    const updateData = {
      $push: {
        likes: {
          userId: userData.userId,
          userDisplayName: userData.userDisplayName,
          createdAt: Date.now()
        }
      },
      $inc: { likeCount: 1 },
      $set: { updatedAt: Date.now() }
    }

    if (shouldBeTrending) {
      updateData.$set.isTrending = true
      updateData.$set.trendingAt = Date.now()
    }

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      updateData,
      { returnDocument: 'after' }
    )

    return {
      challenge: result,
      pointsEarned: POINTS_CONFIG.LIKE_CHALLENGE,
      becameTrending: shouldBeTrending
    }
  } catch (error) { throw new Error(error) }
}

// Unlike a challenge
const unlikeChallenge = async (challengeId, userId) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    const likeIndex = challenge.likes.findIndex(like => like.userId === userId)
    if (likeIndex === -1) throw new Error('Not liked yet')

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      {
        $pull: { likes: { userId: userId } },
        $inc: { likeCount: -1 },
        $set: { updatedAt: Date.now() }
      },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

// Add proof comment to challenge (tham gia thử thách)
const addProofComment = async (challengeId, commentData) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    if (challenge.status !== CHALLENGE_STATUS.ACTIVE) {
      throw new Error('Challenge is not active')
    }

    if (challenge.endDate < Date.now()) {
      throw new Error('Challenge has ended')
    }

    const isNewParticipant = !challenge.comments.some(c => c.userId === commentData.userId && !c._destroy)

    const newComment = {
      _id: new ObjectId().toString(),
      userId: commentData.userId,
      userDisplayName: commentData.userDisplayName,
      userAvatar: commentData.userAvatar || null,
      content: commentData.content || '',
      media: commentData.media || null,
      likes: [],
      likeCount: 0,
      pointsEarned: POINTS_CONFIG.COMMENT_PROOF,
      createdAt: Date.now(),
      updatedAt: null,
      _destroy: false
    }

    const newCommentCount = challenge.commentCount + 1
    // Dynamic trending criteria based on challenge performance compared to average
    const avgStats = await GET_DB().collection(CHALLENGE_COLLECTION_NAME)
      .aggregate([
        { $match: { endDate: { $gt: Date.now() } } },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: '$likeCount' },
            avgComments: { $avg: '$commentCount' },
            avgParticipants: { $avg: '$participantCount' }
          }
        }
      ]).toArray()

    const thresholds = avgStats[0] || { avgLikes: 10, avgComments: 5, avgParticipants: 5 }
    const shouldBeTrending = (
      challenge.likeCount > thresholds.avgLikes * 2 && 
      newCommentCount > thresholds.avgComments * 1.5 &&
      challenge.participantCount > thresholds.avgParticipants * 1.5 &&
      !challenge.isTrending
    )

    const updateData = {
      $push: { comments: newComment },
      $inc: { commentCount: 1 },
      $set: { updatedAt: Date.now() }
    }

    if (isNewParticipant) {
      updateData.$inc.participantCount = 1
    }

    if (shouldBeTrending) {
      updateData.$set.isTrending = true
      updateData.$set.trendingAt = Date.now()
    }

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      updateData,
      { returnDocument: 'after' }
    )

    return {
      challenge: result,
      newComment,
      pointsEarned: POINTS_CONFIG.COMMENT_PROOF,
      isNewParticipant,
      becameTrending: shouldBeTrending
    }
  } catch (error) { throw new Error(error) }
}

// Delete proof comment
const deleteProofComment = async (challengeId, commentId, userId) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    const comment = challenge.comments.find(c => c._id === commentId)
    if (!comment) throw new Error('Comment not found')

    if (comment.userId !== userId) throw new Error('Not authorized to delete this comment')

    const userComments = challenge.comments.filter(c => c.userId === userId && !c._destroy)
    const wasOnlyComment = userComments.length === 1

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId), 'comments._id': commentId },
      {
        $set: {
          'comments.$._destroy': true,
          'comments.$.updatedAt': Date.now(),
          updatedAt: Date.now()
        },
        $inc: {
          commentCount: -1,
          ...(wasOnlyComment ? { participantCount: -1 } : {})
        }
      },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

// Like a comment
const likeComment = async (challengeId, commentId, userData) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    const comment = challenge.comments.find(c => c._id === commentId)
    if (!comment) throw new Error('Comment not found')

    const alreadyLiked = comment.likes.some(like => like.userId === userData.userId)
    if (alreadyLiked) throw new Error('Already liked this comment')

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId), 'comments._id': commentId },
      {
        $push: {
          'comments.$.likes': {
            userId: userData.userId,
            userDisplayName: userData.userDisplayName,
            createdAt: Date.now()
          }
        },
        $inc: {
          'comments.$.likeCount': 1,
          'comments.$.pointsEarned': POINTS_CONFIG.RECEIVE_LIKE_ON_COMMENT
        },
        $set: { updatedAt: Date.now() }
      },
      { returnDocument: 'after' }
    )

    return {
      challenge: result,
      commentOwnerId: comment.userId,
      pointsForOwner: POINTS_CONFIG.RECEIVE_LIKE_ON_COMMENT
    }
  } catch (error) { throw new Error(error) }
}

// Unlike a comment
const unlikeComment = async (challengeId, commentId, userId) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) throw new Error('Challenge not found')

    const comment = challenge.comments.find(c => c._id === commentId)
    if (!comment) throw new Error('Comment not found')

    const likeIndex = comment.likes.findIndex(like => like.userId === userId)
    if (likeIndex === -1) throw new Error('Not liked yet')

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId), 'comments._id': commentId },
      {
        $pull: { 'comments.$.likes': { userId: userId } },
        $inc: { 'comments.$.likeCount': -1 },
        $set: { updatedAt: Date.now() }
      },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

// Get challenge details with all comments (paginated)
const getDetails = async (challengeId, queryObj = {}) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) return null

    const activeComments = challenge.comments.filter(c => !c._destroy)

    let sortedComments = [...activeComments]
    if (queryObj.sortBy === 'popular') {
      sortedComments.sort((a, b) => b.likeCount - a.likeCount)
    } else {
      sortedComments.sort((a, b) => b.createdAt - a.createdAt)
    }

    const commentsPerPage = parseInt(queryObj.limit) || 10
    const page = parseInt(queryObj.page) || 1
    const startIndex = (page - 1) * commentsPerPage
    const paginatedComments = sortedComments.slice(startIndex, startIndex + commentsPerPage)

    return {
      ...challenge,
      comments: paginatedComments,
      totalComments: activeComments.length,
      totalPages: Math.ceil(activeComments.length / commentsPerPage),
      currentPage: page
    }
  } catch (error) { throw new Error(error) }
}

// Check if user has participated (has at least 1 comment)
const hasParticipated = async (challengeId, userId) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) return false
    return challenge.comments.some(c => c.userId === userId && !c._destroy)
  } catch (error) { throw new Error(error) }
}

// Check if user has liked the challenge
const hasLiked = async (challengeId, userId) => {
  try {
    const challenge = await findOneById(challengeId)
    if (!challenge) return false
    return challenge.likes.some(like => like.userId === userId)
  } catch (error) { throw new Error(error) }
}

// Mark challenge as expired
const markExpired = async (challengeId) => {
  try {
    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      {
        $set: {
          status: CHALLENGE_STATUS.EXPIRED,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Get challenges ready for deletion
const getChallengesForDeletion = async () => {
  try {
    const challenges = await GET_DB()
      .collection(CHALLENGE_COLLECTION_NAME)
      .find({
        deleteAfter: { $lt: Date.now() },
        _destroy: false
      })
      .toArray()
    return challenges
  } catch (error) { throw new Error(error) }
}

// Get challenges that need to be marked as expired
const getChallengesForExpiration = async () => {
  try {
    const challenges = await GET_DB()
      .collection(CHALLENGE_COLLECTION_NAME)
      .find({
        endDate: { $lt: Date.now() },
        status: CHALLENGE_STATUS.ACTIVE,
        _destroy: false
      })
      .toArray()
    return challenges
  } catch (error) { throw new Error(error) }
}

// Soft delete challenge
const deleteOneById = async (challengeId) => {
  try {
    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      { $set: { _destroy: true, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Hard delete challenge (for cron job)
const hardDeleteById = async (challengeId) => {
  try {
    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(challengeId)
    })
    return result
  } catch (error) { throw new Error(error) }
}

// Update challenge
const update = async (challengeId, updateData) => {
  try {
    delete updateData._id
    delete updateData.createdAt
    delete updateData.createdBy

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(CHALLENGE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

export const challengeModel = {
  CHALLENGE_COLLECTION_NAME,
  CHALLENGE_COLLECTION_SCHEMA,
  POINTS_CONFIG,
  MEDIA_TYPES,
  createNew,
  findOneById,
  getChallengesByCreator,
  getUserParticipatedChallenges,
  getAllChallenges,
  likeChallenge,
  unlikeChallenge,
  addProofComment,
  deleteProofComment,
  likeComment,
  unlikeComment,
  getDetails,
  hasParticipated,
  hasLiked,
  markExpired,
  getChallengesForDeletion,
  getChallengesForExpiration,
  deleteOneById,
  hardDeleteById,
  update
}
