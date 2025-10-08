import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { CHALLENGE_TYPES, CHALLENGE_DIFFICULTY } from '~/utils/constants'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(10).max(200).trim().strict(),
    description: Joi.string().required().min(50).max(2000).trim().strict(),
    type: Joi.string().valid(...Object.keys(CHALLENGE_TYPES)).required(),
    difficulty: Joi.string().valid(...Object.keys(CHALLENGE_DIFFICULTY)).required(),
    duration: Joi.number().required().min(1).max(365), // days
    maxParticipants: Joi.number().optional().min(1).max(10000),
    reward: Joi.object({
      type: Joi.string().valid('coins', 'points', 'badge', 'item').required(),
      amount: Joi.number().when('type', {
        is: Joi.string().valid('coins', 'points'),
        then: Joi.required().min(1).max(10000),
        otherwise: Joi.optional()
      }),
      item: Joi.string().when('type', {
        is: 'item',
        then: Joi.required().min(3).max(50),
        otherwise: Joi.optional()
      }),
      badge: Joi.string().when('type', {
        is: 'badge',
        then: Joi.required().min(3).max(50),
        otherwise: Joi.optional()
      })
    }).required(),
    requirements: Joi.array().items(Joi.string().min(10).max(200)).min(1).max(10).required(),
    tips: Joi.array().items(Joi.string().min(10).max(200)).max(10).optional(),
    featured: Joi.boolean().default(false),
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled').default('active')
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().min(10).max(200).trim().strict(),
    description: Joi.string().min(50).max(2000).trim().strict(),
    type: Joi.string().valid(...Object.keys(CHALLENGE_TYPES)),
    difficulty: Joi.string().valid(...Object.keys(CHALLENGE_DIFFICULTY)),
    duration: Joi.number().min(1).max(365),
    maxParticipants: Joi.number().min(1).max(10000),
    reward: Joi.object({
      type: Joi.string().valid('coins', 'points', 'badge', 'item').required(),
      amount: Joi.number().when('type', {
        is: Joi.string().valid('coins', 'points'),
        then: Joi.required().min(1).max(10000),
        otherwise: Joi.optional()
      }),
      item: Joi.string().when('type', {
        is: 'item',
        then: Joi.required().min(3).max(50),
        otherwise: Joi.optional()
      }),
      badge: Joi.string().when('type', {
        is: 'badge',
        then: Joi.required().min(3).max(50),
        otherwise: Joi.optional()
      })
    }),
    requirements: Joi.array().items(Joi.string().min(10).max(200)).min(1).max(10),
    tips: Joi.array().items(Joi.string().min(10).max(200)).max(10),
    featured: Joi.boolean(),
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled')
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateProgress = async (req, res, next) => {
  const correctCondition = Joi.object({
    increment: Joi.number().optional().min(1).max(100),
    evidence: Joi.object({
      type: Joi.string().valid('image', 'text', 'location', 'purchase').optional(),
      description: Joi.string().min(10).max(500).optional(),
      imageUrl: Joi.string().uri().optional()
    }).optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const submitEvidence = async (req, res, next) => {
  const correctCondition = Joi.object({
    type: Joi.string().valid('image', 'text', 'location', 'purchase').required(),
    description: Joi.string().required().min(10).max(500),
    imageUrl: Joi.string().uri().optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const challengeValidation = {
  createNew,
  update,
  updateProgress,
  submitEvidence
}