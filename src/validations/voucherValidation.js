import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const requestUse = async (req, res, next) => {
  const correctCondition = Joi.object({
    voucherId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    productId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional().allow('')
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
  } catch (error) {
    next(new Error(error))
  }
}

const confirmUsage = async (req, res, next) => {
  const correctCondition = Joi.object({
    voucherId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(req.params, {
      abortEarly: false
    })
    next()
  } catch (error) {
    next(new Error(error))
  }
}

export const voucherValidation = {
  requestUse,
  confirmUsage
}
