import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // Delegate business logic to service layer
    const createdBoard = await boardService.createNew(userId, req.body)
    // Return successful response to client
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (err) {
    next(err)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const board = await boardService.getDetails(userId, boardId)
    res.status(StatusCodes.OK).json(board)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const updatedBoard = await boardService.update(boardId, req.body)
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (err) {
    next(err)
  }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (err) {
    next(err)
  }
}

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // Extract pagination and search parameters from query string
    const { page, itemsPerPage, q } = req.query
    const queryFilters = q
    const results = await boardService.getBoards(userId, page, itemsPerPage, queryFilters)
    res.status(StatusCodes.OK).json(results)
  } catch (error) { next(error) }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards
}