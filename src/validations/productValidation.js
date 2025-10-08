import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { PRODUCT_CATEGORIES } from '~/utils/constants'

const createNew = async (req, res, next) => {
  // Parse numeric strings and links JSON string
  const body = { ...req.body }
  body.price = Number(body.price)
  body.discount = Number(body.discount)
  body.stock = Number(body.stock)
  
  // Parse links if it's a JSON string
  if (typeof body.links === 'string') {
    try {
      body.links = JSON.parse(body.links)
    } catch (e) {
      body.links = {}
    }
  }
  
  const correctCondition = Joi.object({
    name: Joi.string().required().min(3).max(255).trim().strict(),
    description: Joi.string().required().min(10).max(2000).trim().strict(),
    shortDescription: Joi.string().optional().max(500).trim().allow(''),
    category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).required(),
    price: Joi.number().required().min(1000).max(10000000), // VND from 1k to 10M
    discount: Joi.number().optional().min(0).max(100).default(0),
    stock: Joi.number().required().min(0).max(10000),
    links: Joi.object({
      shopee: Joi.string().uri().allow('').optional(),
      tiktok: Joi.string().uri().allow('').optional(),
      facebook: Joi.string().uri().allow('').optional()
    }).optional().allow(null)
  })

  try {
    await correctCondition.validateAsync(body, { abortEarly: false })
    // Override req.body with parsed values
    req.body = body
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const update = async (req, res, next) => {
  // Parse numeric strings and links JSON string
  const body = { ...req.body }
  if (body.price) body.price = Number(body.price)
  if (body.discount) body.discount = Number(body.discount)
  if (body.stock) body.stock = Number(body.stock)
  
  // Parse links if it's a JSON string
  if (typeof body.links === 'string') {
    try {
      body.links = JSON.parse(body.links)
    } catch (e) {
      body.links = {}
    }
  }
  
  const correctCondition = Joi.object({
    name: Joi.string().min(3).max(255).trim().strict(),
    description: Joi.string().min(10).max(2000).trim().strict(),
    shortDescription: Joi.string().max(500).trim().allow(''),
    category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)),
    price: Joi.number().min(1000).max(10000000),
    discount: Joi.number().min(0).max(100),
    stock: Joi.number().min(0).max(10000),
    links: Joi.object({
      shopee: Joi.string().uri().allow('').optional(),
      tiktok: Joi.string().uri().allow('').optional(),
      facebook: Joi.string().uri().allow('').optional()
    }).optional().allow(null)
  })

  try {
    await correctCondition.validateAsync(body, {
      abortEarly: false,
      allowUnknown: true
    })
    // Override req.body with parsed values
    req.body = body
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateStock = async (req, res, next) => {
  const correctCondition = Joi.object({
    quantity: Joi.number().required().min(-1000).max(1000) // Allow negative for reducing stock
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const productValidation = {
  createNew,
  update,
  updateStock
}