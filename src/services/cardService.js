import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }

    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }

    return getNewCard
  } catch (err) { throw err }
}

const update = async (cardId, reqBody, cardCoverFile, userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    let updatedCard = {}

    if (cardCoverFile) {
      // Case upload file to Cloud Storage - Cloudinary
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')

      // Store URL (secure_url) of image file to DB
      updatedCard = await cardModel.update(cardId, {
        cover: uploadResult.secure_url
      })
    } else if (updateData.commentToAdd) {
      // Create comment data to DB, add needed fields
      const commentData = {
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      // Case ADD or REMOVE member from Card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else {
      // Case update common infor
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) { throw error }
}

export const cardService = {
  createNew,
  update
}
