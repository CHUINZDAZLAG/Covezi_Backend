import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

// XP Transaction types - tracks every XP earning event
const XP_EVENT_TYPES = {
  DAILY_LOGIN: 'daily_login',
  LIKE_CHALLENGE: 'like_challenge',
  JOIN_CHALLENGE: 'join_challenge',
  CREATE_CHALLENGE: 'create_challenge'
}

const XP_COLLECTION_NAME = 'xp_transactions'
const XP_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  eventType: Joi.string().valid(...Object.values(XP_EVENT_TYPES)).required(),
  xpAmount: Joi.number().required().min(1),
  
  // Daily Login specific
  loginStreak: Joi.number().min(1), // Which day of streak
  
  // Like Challenge specific
  challengeId: Joi.string(),
  likesCountToday: Joi.number().min(1).max(5), // Track daily like count (max 5 per day)
  
  // Join Challenge specific
  isFirstTimeJoin: Joi.boolean().default(true),
  
  // Create Challenge specific
  createdChallengeId: Joi.string(),
  participantCount: Joi.number().min(0), // Updated when challenge reaches 10 joins
  
  metadata: Joi.object().default({}),
  
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await XP_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(XP_COLLECTION_NAME).insertOne(validData)
    return result
  } catch (error) { throw new Error(error) }
}

const findByUserAndEvent = async (userId, eventType, dateRange = null) => {
  try {
    const query = { userId, eventType, _destroy: false }
    
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    }
    
    const result = await GET_DB().collection(XP_COLLECTION_NAME).find(query).toArray()
    return result
  } catch (error) { throw new Error(error) }
}

/**
 * Get today's daily login record for a user
 */
const getTodayLoginRecord = async (userId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const result = await GET_DB().collection(XP_COLLECTION_NAME).findOne({
      userId,
      eventType: XP_EVENT_TYPES.DAILY_LOGIN,
      createdAt: { $gte: today, $lt: tomorrow },
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

/**
 * Get today's like count for a user
 */
const getTodayLikeCount = async (userId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const likes = await GET_DB().collection(XP_COLLECTION_NAME).find({
      userId,
      eventType: XP_EVENT_TYPES.LIKE_CHALLENGE,
      createdAt: { $gte: today, $lt: tomorrow },
      _destroy: false
    }).toArray()
    
    return likes.length
  } catch (error) { throw new Error(error) }
}

/**
 * Check if user already joined this challenge (for XP tracking)
 */
const checkChallengeParticipation = async (userId, challengeId) => {
  try {
    const result = await GET_DB().collection(XP_COLLECTION_NAME).findOne({
      userId,
      eventType: XP_EVENT_TYPES.JOIN_CHALLENGE,
      challengeId,
      _destroy: false
    })
    return !!result
  } catch (error) { throw new Error(error) }
}

/**
 * Get user's eligible challenge creations this month (max 3)
 */
const getMonthlyEligibleChallengeCount = async (userId) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const result = await GET_DB().collection(XP_COLLECTION_NAME).find({
      userId,
      eventType: XP_EVENT_TYPES.CREATE_CHALLENGE,
      createdAt: { $gte: startOfMonth },
      _destroy: false,
      participantCount: { $gte: 10 } // Only count eligible challenges (10+ joins)
    }).toArray()
    
    return result.length
  } catch (error) { throw new Error(error) }
}

/**
 * Update participant count for create challenge when it reaches 10
 */
const updateChallengeParticipantCount = async (challengeId, participantCount) => {
  try {
    const result = await GET_DB().collection(XP_COLLECTION_NAME).updateOne(
      {
        createdChallengeId: challengeId,
        eventType: XP_EVENT_TYPES.CREATE_CHALLENGE,
        _destroy: false
      },
      { $set: { participantCount } }
    )
    return result
  } catch (error) { throw new Error(error) }
}

export const xpTransactionModel = {
  XP_COLLECTION_NAME,
  XP_COLLECTION_SCHEMA,
  XP_EVENT_TYPES,
  createNew,
  findByUserAndEvent,
  getTodayLoginRecord,
  getTodayLikeCount,
  checkChallengeParticipation,
  getMonthlyEligibleChallengeCount,
  updateChallengeParticipantCount
}
