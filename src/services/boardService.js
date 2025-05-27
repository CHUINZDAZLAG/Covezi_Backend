/* eslint-disable no-empty */
import { slugify } from "~/utils/formatters"

const createNew = (reqBody) => {
  try {
    // Xu ly logic du lieu
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Tra ket qua ve cho tang Service
    return newBoard
  } catch (error) {

  }
}

export const boardService = {
  createNew
}
