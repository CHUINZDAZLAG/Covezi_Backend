import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Voucher status constants
export const VOUCHER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  USED: 'used',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
}

// Collection name and schema
const VOUCHER_COLLECTION_NAME = 'vouchers'
const VOUCHER_COLLECTION_SCHEMA = Joi.object({
  // Unique voucher code format: {userId}+{createdDate(YYYYMMDD)}+{expiryDate(YYYYMMDD)}
  voucherCode: Joi.string().required().trim(),
  
  // User who owns the voucher
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  
  // Discount percentage (10, 20, 30, 50, 70, 100)
  percent: Joi.number().required().min(1).max(100),
  
  // Level at which voucher was earned
  levelReward: Joi.number().required().min(1),
  
  // Voucher status: active, pending, used, rejected, expired, cancelled
  status: Joi.string()
    .valid(...Object.values(VOUCHER_STATUS), 'cancelled')
    .default(VOUCHER_STATUS.ACTIVE),
  
  // Product ID that voucher can be used for (optional - can be used for any product)
  productId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .allow('')
    .default(''),
  
  // When user requests to use voucher, track the request
  usageRequest: Joi.object({
    requestId: Joi.string(),
    requestedAt: Joi.date().timestamp('javascript'),
    status: Joi.string().valid('pending', 'confirmed', 'rejected'),
    // Proof that voucher was used (screenshot URL, link to social media post, etc)
    proofUrl: Joi.string().trim().allow('').default(''),
    // Platform where shared (facebook, whatsapp, instagram, link, etc)
    sharedOn: Joi.string().trim().allow('').default('')
  }).optional(),
  
  // Sharing info - track when user shares voucher to other platforms
  sharingHistory: Joi.array().items(
    Joi.object({
      platform: Joi.string().required(), // facebook, whatsapp, instagram, twitter, telegram, copy_link
      sharedAt: Joi.date().timestamp('javascript').default(Date.now),
      shareCount: Joi.number().default(1),
      link: Joi.string().trim().allow('').default('') // Direct share link or reference
    })
  ).default([]),
  
  // When admin confirms usage
  confirmedAt: Joi.date().timestamp('javascript').optional(),
  confirmedBy: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .optional(),

  // When admin rejects usage
  rejectedAt: Joi.date().timestamp('javascript').optional(),
  rejectedBy: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .optional(),

  // When admin cancels voucher
  cancelledAt: Joi.date().timestamp('javascript').optional(),
  cancelledBy: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .optional(),
  cancelReason: Joi.string().trim().allow('').default(''),
  
  // Expiry date (180 days from creation by default)
  expiresAt: Joi.date().timestamp('javascript').required(),
  
  // Metadata
  description: Joi.string().trim().default(''),
  
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'voucherCode', 'userId', 'levelReward', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await VOUCHER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

// Create new voucher when user reaches milestone level
const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newVoucher = {
      ...validData,
      userId: new ObjectId(validData.userId)
    }
    
    const createdVoucher = await GET_DB().collection(VOUCHER_COLLECTION_NAME).insertOne(newVoucher)
    return createdVoucher
  } catch (error) { throw new Error(error) }
}

// Find voucher by ID
const findOneById = async (voucherId) => {
  try {
    const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOne({
      _id: new ObjectId(voucherId),
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

// Find voucher by code
const findByCode = async (voucherCode) => {
  try {
    const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOne({
      voucherCode,
      _destroy: false
    })
    return result
  } catch (error) { throw new Error(error) }
}

// Get all vouchers for a user
const getByUserId = async (userId) => {
  try {
    const results = await GET_DB()
      .collection(VOUCHER_COLLECTION_NAME)
      .find({ userId: new ObjectId(userId), _destroy: false })
      .toArray()
    return results
  } catch (error) { throw new Error(error) }
}

// Get active vouchers for a user (that can be used)
const getActiveByUserId = async (userId) => {
  try {
    const results = await GET_DB()
      .collection(VOUCHER_COLLECTION_NAME)
      .find({
        userId: new ObjectId(userId),
        status: VOUCHER_STATUS.ACTIVE,
        expiresAt: { $gt: Date.now() },
        _destroy: false
      })
      .toArray()
    return results
  } catch (error) { throw new Error(error) }
}

// Get pending voucher requests (for admin dashboard)
const getPendingRequests = async () => {
  try {
    const results = await GET_DB()
      .collection(VOUCHER_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            status: VOUCHER_STATUS.PENDING,
            _destroy: false
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $sort: { 'usageRequest.requestedAt': -1 }
        }
      ])
      .toArray()
    return results
  } catch (error) { throw new Error(error) }
}

// Update voucher status
const update = async (voucherId, updateData) => {
  try {
    // Remove invalid fields
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })
    
    const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(voucherId) },
      { $set: { ...updateData, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Delete voucher (soft delete)
const deleteOneById = async (voucherId) => {
  try {
    const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(voucherId) },
      { $set: { _destroy: true, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Get all vouchers with filtering
const findAll = async (query = {}, options = {}) => {
  try {
    const sort = options.sort || { createdAt: -1 }
    const limit = options.limit || 0
    const skip = options.skip || 0

    // Convert userId to ObjectId if present
    if (query.userId) {
      query.userId = new ObjectId(query.userId)
    }

    const results = await GET_DB()
      .collection(VOUCHER_COLLECTION_NAME)
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()
    return results
  } catch (error) { throw new Error(error) }
}

// Get global voucher statistics
const getGlobalStats = async () => {
  try {
    const collection = GET_DB().collection(VOUCHER_COLLECTION_NAME)

    const total = await collection.countDocuments({ _destroy: false })
    const byStatus = await collection.aggregate([
      { $match: { _destroy: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray()

    const stats = {
      total,
      byStatus: {}
    }

    byStatus.forEach(item => {
      stats.byStatus[item._id] = item.count
    })

    return stats
  } catch (error) { throw new Error(error) }
}

// Delete expired vouchers (hard delete)
const deleteExpiredVouchers = async (beforeDate = null) => {
  try {
    const cutoffDate = beforeDate || new Date()

    const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).deleteMany({
      expiresAt: { $lt: cutoffDate },
      _destroy: false
    })

    return result
  } catch (error) { throw new Error(error) }
}

// Record when user shares voucher to social media platform
const recordSharing = async (voucherId, platform, link = '') => {
  try {
    const voucher = await findOneById(voucherId)
    if (!voucher) throw new Error('Voucher not found')

    // Check if already shared to this platform today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingShare = voucher.sharingHistory?.find(h => {
      const shareDate = new Date(h.sharedAt)
      shareDate.setHours(0, 0, 0, 0)
      return h.platform === platform && shareDate.getTime() === today.getTime()
    })

    if (existingShare) {
      // Update share count for same platform on same day
      const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(voucherId), 'sharingHistory.platform': platform },
        { 
          $inc: { 'sharingHistory.$.shareCount': 1 },
          $set: { updatedAt: Date.now() }
        },
        { returnDocument: 'after' }
      )
      return result
    } else {
      // Add new sharing record
      const result = await GET_DB().collection(VOUCHER_COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(voucherId) },
        { 
          $push: { 
            sharingHistory: {
              platform,
              sharedAt: Date.now(),
              shareCount: 1,
              link
            }
          },
          $set: { updatedAt: Date.now() }
        },
        { returnDocument: 'after' }
      )
      return result
    }
  } catch (error) { throw new Error(error) }
}

export const voucherModel = {
  VOUCHER_COLLECTION_NAME,
  VOUCHER_COLLECTION_SCHEMA,
  VOUCHER_STATUS,
  createNew,
  findOneById,
  findByCode,
  findAll,
  getByUserId,
  getActiveByUserId,
  getPendingRequests,
  update,
  deleteOneById,
  deleteExpiredVouchers,
  getGlobalStats,
  recordSharing
}
