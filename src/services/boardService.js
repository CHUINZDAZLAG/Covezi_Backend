/* eslint-disable no-useless-catch */
/* eslint-disable no-empty */
import { slugify } from '~/utils/formatters'
import { broadModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'

const createNew = async (reqBody) => {
  try {
    // Xu ly logic du lieu

    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Goi toi tang Model de xu ly luu ban ghi vao Database
    const createdBoard = await broadModel.createNew(newBoard)

    // Lay ban ghi sau khi goi
    const getNewBoard = await broadModel.findOneById(createdBoard.insertedId)

    // Tra ket qua ve cho tang Service
    return getNewBoard
  } catch (err) { throw err }
}

const getDetails = async (boardId) => {
  try {
    const board = await broadModel.getDetails(boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    }

    // Convert data to format that FE can use to display after query database
    // CLone data to avoid affecting origin data
    const resBoard = cloneDeep(board)

    // Move card back to its correct column
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id))
      // column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
    })

    // Delete card from board
    delete resBoard.cards

    return resBoard
  } catch (err) { throw err }
}

export const boardService = {
  createNew,
  getDetails
}
