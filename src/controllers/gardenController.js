import { StatusCodes } from 'http-status-codes'
import { gardenService } from '~/services/gardenService'

const getGarden = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const garden = await gardenService.getGardenDetails(userId)

    res.status(StatusCodes.OK).json(garden)
  } catch (error) { next(error) }
}

const getAvailableVouchers = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const vouchers = await gardenService.getAvailableVouchers(userId)

    res.status(StatusCodes.OK).json({ vouchers })
  } catch (error) { next(error) }
}

const claimVoucher = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { voucherId } = req.params

    const result = await gardenService.claimVoucher(userId, voucherId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const plantTree = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { treeType, position } = req.body

    const updatedGarden = await gardenService.plantTree(userId, treeType, position)

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Tree planted successfully'
    })
  } catch (error) { next(error) }
}

const waterTree = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { treeId } = req.params
    
    const updatedGarden = await gardenService.waterTree(userId, treeId)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Tree watered successfully'
    })
  } catch (error) { next(error) }
}

const fertilizeTree = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { treeId } = req.params
    
    const updatedGarden = await gardenService.fertilizeTree(userId, treeId)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Tree fertilized successfully'
    })
  } catch (error) {
    next(error)
  }
}

const harvestTree = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { treeId } = req.params
    
    const result = await gardenService.harvestTree(userId, treeId)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.garden,
      rewards: result.rewards,
      message: 'Tree harvested successfully'
    })
  } catch (error) { next(error) }
}

const buyItem = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { itemType, itemData } = req.body
    
    const updatedGarden = await gardenService.buyItem(userId, itemType, itemData)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Item purchased successfully'
    })
  } catch (error) { next(error) }
}

const placeDecoration = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { decorationId, position } = req.body
    
    const updatedGarden = await gardenService.placeDecoration(userId, decorationId, position)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Decoration placed successfully'
    })
  } catch (error) { next(error) }
}

// Customize master tree design
const customizeTree = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const customization = req.body

    const updatedGarden = await gardenService.customizeTree(userId, customization)

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedGarden,
      message: 'Tree customized successfully'
    })
  } catch (error) { next(error) }
}

export const gardenController = {
  getGarden,
  getAvailableVouchers,
  claimVoucher,
  plantTree,
  waterTree,
  fertilizeTree,
  harvestTree,
  buyItem,
  placeDecoration,
  customizeTree
}