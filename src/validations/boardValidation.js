/* eslint-disable no-console */
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'


const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(255).trim().strict(),
    description: Joi.string().required().min(3).max(255).trim().strict()
  })

  try {
    console.log(req.body)

    // Chi dinh abortEarly: false de xu ly truong hop co nhieu loi validation de tra ve tat ca loi
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    // Validation xong thi cho request chay tiep sang Controller
    next()
  } catch (error) {
    console.log('Error: ', error)
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      errors: new Error(error).message
    })
  }
}

export const boardValidation = {
  createNew
}