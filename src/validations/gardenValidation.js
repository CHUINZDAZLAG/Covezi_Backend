import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { TREE_TYPES } from '~/utils/constants'

const plantTree = async (req, res, next) => {
  const correctCondition = Joi.object({
    treeType: Joi.string().valid(...Object.keys(TREE_TYPES)).required(),
    position: Joi.object({
      x: Joi.number().required().min(0).max(9), // 10x10 grid (0-9)
      y: Joi.number().required().min(0).max(9)
    }).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const buyItem = async (req, res, next) => {
  const correctCondition = Joi.object({
    itemType: Joi.string().valid('seed', 'tool', 'decoration').required(),
    itemData: Joi.object({
      type: Joi.string().required().min(3).max(50),
      quantity: Joi.number().when('..itemType', {
        is: 'seed',
        then: Joi.optional().min(1).max(10),
        otherwise: Joi.optional()
      })
    }).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const placeDecoration = async (req, res, next) => {
  const correctCondition = Joi.object({
    decorationId: Joi.string().required().min(10).max(50),
    position: Joi.object({
      x: Joi.number().required().min(0).max(9),
      y: Joi.number().required().min(0).max(9)
    }).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const gardenValidation = {
  plantTree,
  buyItem,
  placeDecoration
}