import Joi from 'joi'

export const createSessionSchema = Joi.object({
  title: Joi.string().max(200).allow(null, '').optional()
})

export const updateSessionSchema = Joi.object({
  title: Joi.string().max(200).required()
})

export const sendMessageSchema = Joi.object({
  sessionId: Joi.string().required(),
  content: Joi.string().min(1).max(10000).required()
})
