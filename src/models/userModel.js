import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'

// Define user roles for authorization system (can be extended based on project requirements)
const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin'
}

// Define MongoDB collection name and Joi validation schema
const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE), // unique
  password: Joi.string().required(),
  // Username derived from email may not be unique due to same usernames from different providers
  username: Joi.string().required().trim().strict(),
  displayName: Joi.string().required().trim().strict(),
  avatar: Joi.string().default(null),
  role: Joi.string().valid(...Object.values(USER_ROLES)).default(USER_ROLES.CLIENT),

  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),

  // PIN verification fields for registration process
  pinVerification: Joi.object({
    pin: Joi.string(),
    expiryTime: Joi.number(),
    attempts: Joi.number().default(0),
    maxAttempts: Joi.number().default(5)
  }).default(null),
  registerVerificationToken: Joi.string().default(null),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Specify fields that should not be allowed for updates in the update() function
const INVALID_UPDATE_FIELDS = ['_id', 'email', 'username', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
    return createdUser
  } catch (error) { throw new Error(error) }
}

const findOneById = async (userId) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) })
    return result
  } catch (error) { throw new Error(error) }
}

const findOneByEmail = async (emailValue) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({ email: emailValue })
    return result
  } catch (error) { throw new Error(error) }
}

const update = async (userId, updateData) => {
  try {
    // Filter out fields that are not allowed to be updated for data integrity
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' } // Return updated document instead of original
    )

    return result
  } catch (error) { throw new Error(error) }
}

// Count documents matching a filter
const countDocuments = async (filter = {}) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).countDocuments(filter)
    return result
  } catch (error) { throw new Error(error) }
}

// Find all users matching a filter with pagination and sorting
const findAll = async (filter = {}, options = {}) => {
  try {
    const sort = options.sort || { createdAt: -1 }
    const limit = options.limit || 0
    const skip = options.skip || 0

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    return result
  } catch (error) { throw new Error(error) }
}

// Aggregate documents (for complex queries)
const aggregate = async (pipeline = []) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray()

    return result
  } catch (error) { throw new Error(error) }
}

const isAdmin = (user) => {
  return user && user.role === USER_ROLES.ADMIN
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  USER_ROLES,
  createNew,
  findOneById,
  findOneByEmail,
  update,
  countDocuments,
  findAll,
  aggregate,
  isAdmin
}