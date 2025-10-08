import express from 'express'
import { gardenController } from '~/controllers/gardenController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { gardenValidation } from '~/validations/gardenValidation'

const Router = express.Router()

// Route: GET /v1/garden - Get user's garden
Router.route('/')
  .get(authMiddleware.isAuthorized, gardenController.getGarden)

// Route: GET /v1/garden/vouchers - Get available vouchers for user
Router.route('/vouchers')
  .get(authMiddleware.isAuthorized, gardenController.getAvailableVouchers)

// Route: POST /v1/garden/vouchers/:voucherId/claim - Claim a voucher
Router.route('/vouchers/:voucherId/claim')
  .post(authMiddleware.isAuthorized, gardenController.claimVoucher)

// Route: POST /v1/garden/plant - Plant a tree
Router.route('/plant')
  .post(authMiddleware.isAuthorized, gardenValidation.plantTree, gardenController.plantTree)

// Route: PUT /v1/garden/trees/:treeId/water - Water a tree
Router.route('/trees/:treeId/water')
  .put(authMiddleware.isAuthorized, gardenController.waterTree)

// Route: PUT /v1/garden/trees/:treeId/fertilize - Fertilize a tree
Router.route('/trees/:treeId/fertilize')
  .put(authMiddleware.isAuthorized, gardenController.fertilizeTree)

// Route: POST /v1/garden/trees/:treeId/harvest - Harvest a tree
Router.route('/trees/:treeId/harvest')
  .post(authMiddleware.isAuthorized, gardenController.harvestTree)

// Route: POST /v1/garden/shop/buy - Buy items (seeds, tools, decorations)
Router.route('/shop/buy')
  .post(authMiddleware.isAuthorized, gardenValidation.buyItem, gardenController.buyItem)

// Route: POST /v1/garden/decorations/place - Place decoration
Router.route('/decorations/place')
  .post(authMiddleware.isAuthorized, gardenValidation.placeDecoration, gardenController.placeDecoration)

// ===== NEW GARDEN GRID ROUTES =====

// Route: POST /v1/garden/customize-tree - Customize master tree design
Router.route('/customize-tree')
  .post(authMiddleware.isAuthorized, gardenController.customizeTree)

// Route: POST /v1/garden/plant-tree-in-plot - Plant tree in specific plot
Router.route('/plant-tree-in-plot')
  .post(authMiddleware.isAuthorized, gardenController.plantTreeInPlot)

// Route: POST /v1/garden/garden-action - Perform action on tree in plot (water/fertilize)
Router.route('/garden-action')
  .post(authMiddleware.isAuthorized, gardenController.performGardenAction)

// Route: POST /v1/garden/harvest-garden-tree - Harvest tree from plot
Router.route('/harvest-garden-tree')
  .post(authMiddleware.isAuthorized, gardenController.harvestGardenTree)

export const gardenRoute = Router