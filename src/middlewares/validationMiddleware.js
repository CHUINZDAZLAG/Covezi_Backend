import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

/**
 * Validation middleware using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validationMiddleware = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body against schema
      await schema.validateAsync(req.body, { abortEarly: false })
      next()
    } catch (error) {
      // Format Joi validation errors
      const errorMessage = error.details
        ? error.details.map(detail => detail.message).join(', ')
        : error.message

      next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
    }
  }
}
