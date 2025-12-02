import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const CHAT_SESSION_COLLECTION = 'chat_sessions'

// Helper to validate ObjectId
const isValidObjectId = (id) => {
  if (!id) return false
  try {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)
  } catch {
    return false
  }
}

const chatSessionModel = {
  /**
   * Create a new chat session
   */
  createNew: async (data) => {
    try {
      const result = await GET_DB().collection(CHAT_SESSION_COLLECTION).insertOne({
        userId: new ObjectId(data.userId),
        title: data.title || 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return result
    } catch (error) {
      throw error
    }
  },

  /**
   * Find sessions by user ID
   */
  findByUserId: async (userId, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit
      const sessions = await GET_DB()
        .collection(CHAT_SESSION_COLLECTION)
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const total = await GET_DB()
        .collection(CHAT_SESSION_COLLECTION)
        .countDocuments({ userId: new ObjectId(userId) })

      return { sessions, total }
    } catch (error) {
      throw error
    }
  },

  /**
   * Find session by ID
   */
  findById: async (sessionId) => {
    try {
      if (!isValidObjectId(sessionId)) {
        return null
      }
      const session = await GET_DB()
        .collection(CHAT_SESSION_COLLECTION)
        .findOne({ _id: new ObjectId(sessionId) })
      return session
    } catch (error) {
      throw error
    }
  },

  /**
   * Update session
   */
  update: async (sessionId, data) => {
    try {
      const result = await GET_DB()
        .collection(CHAT_SESSION_COLLECTION)
        .updateOne(
          { _id: new ObjectId(sessionId) },
          { $set: { ...data, updatedAt: new Date() } }
        )
      return result
    } catch (error) {
      throw error
    }
  },

  /**
   * Delete session
   */
  deleteOne: async (sessionId) => {
    try {
      const result = await GET_DB()
        .collection(CHAT_SESSION_COLLECTION)
        .deleteOne({ _id: new ObjectId(sessionId) })
      return result
    } catch (error) {
      throw error
    }
  }
}

export { chatSessionModel }
