import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    // Dieu huong sang tang Service
    const createdBoard = await boardService.createNew(req.body)
    // Tra ket qua ve phia Client
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (err) {
    next(err)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const board = await boardService.getDetails(boardId)

    res.status(StatusCodes.OK).json(board)
  } catch (err) {
    next(err)
  }
}

export const boardController = {
  createNew,
  getDetails
}