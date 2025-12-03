import express from 'express'
import { gardenController } from '~/controllers/gardenController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { gardenValidation } from '~/validations/gardenValidation'

const Router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Garden
 *   description: Virtual garden gamification and tree growing system
 */

/**
 * @swagger
 * /v1/garden:
 *   get:
 *     summary: Get user's virtual garden
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Garden retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/UserGarden'
 *                         - type: object
 *                           properties:
 *                             gardenPlots:
 *                               type: array
 *                               description: Active garden plots with crops
 *                             inventory:
 *                               type: object
 *                               properties:
 *                                 seeds:
 *                                   type: object
 *                                   example: { oak: 5, bamboo: 3, flower: 10 }
 *                                 water:
 *                                   type: integer
 *                                   example: 85
 *                                 fertilizer:
 *                                   type: integer
 *                                   example: 12
 *                                 tools:
 *                                   type: array
 *                                   example: [{ id: "basic_shovel", name: "Basic Shovel", durability: 95 }]
 *       404:
 *         description: Garden not initialized (will auto-create on first access)
 */
// Route: GET /v1/garden - Get user's garden
Router.route('/')
  .get(authMiddleware.isAuthorized, gardenController.getGarden)

/**
 * @swagger
 * /v1/garden/vouchers:
 *   get:
 *     summary: Get available vouchers for user's level
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available vouchers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           unlockLevel:
 *                             type: integer
 *                             example: 20
 *                           code:
 *                             type: string
 *                             example: ECO20
 *                           discount:
 *                             type: integer
 *                             example: 20
 *                           description:
 *                             type: string
 *                             example: "20% off eco products"
 */
// Route: GET /v1/garden/vouchers - Get available vouchers for user
Router.route('/vouchers')
  .get(authMiddleware.isAuthorized, gardenController.getAvailableVouchers)

/**
 * @swagger
 * /v1/garden/vouchers/{voucherId}/claim:
 *   post:
 *     summary: Claim a voucher reward
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: voucherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Voucher ID to claim
 *     responses:
 *       200:
 *         description: Voucher claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Voucher'
 *       400:
 *         description: Voucher already claimed or not eligible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: POST /v1/garden/vouchers/:voucherId/claim - Claim a voucher
Router.route('/vouchers/:voucherId/claim')
  .post(authMiddleware.isAuthorized, gardenController.claimVoucher)

/**
 * @swagger
 * /v1/garden/plant:
 *   post:
 *     summary: Plant a tree in garden plot
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - position
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [oak, pine, bamboo, flower]
 *                 example: oak
 *               position:
 *                 type: object
 *                 properties:
 *                   row:
 *                     type: integer
 *                     example: 0
 *                   col:
 *                     type: integer
 *                     example: 1
 *               name:
 *                 type: string
 *                 example: My Oak Tree
 *                 default: Auto-generated
 *     responses:
 *       201:
 *         description: Tree planted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         garden:
 *                           $ref: '#/components/schemas/UserGarden'
 *                         treeId:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         experienceGained:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Not enough seeds or position occupied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: POST /v1/garden/plant - Plant a tree
Router.route('/plant')
  .post(authMiddleware.isAuthorized, gardenValidation.plantTree, gardenController.plantTree)

/**
 * @swagger
 * /v1/garden/trees/{treeId}/water:
 *   put:
 *     summary: Water a tree (Improves growth +15%, health +10%)
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tree ID
 *     responses:
 *       200:
 *         description: Tree watered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         garden:
 *                           $ref: '#/components/schemas/UserGarden'
 *                         experienceGained:
 *                           type: integer
 *                           example: 5
 *                         growthImproved:
 *                           type: integer
 *                           example: 15
 *       400:
 *         description: Not enough water or tree not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: PUT /v1/garden/trees/:treeId/water - Water a tree
Router.route('/trees/:treeId/water')
  .put(authMiddleware.isAuthorized, gardenController.waterTree)

/**
 * @swagger
 * /v1/garden/trees/{treeId}/fertilize:
 *   put:
 *     summary: Fertilize a tree (Improves growth +25%, health +20%)
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tree ID
 *     responses:
 *       200:
 *         description: Tree fertilized successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         garden:
 *                           $ref: '#/components/schemas/UserGarden'
 *                         experienceGained:
 *                           type: integer
 *                           example: 10
 *                         growthImproved:
 *                           type: integer
 *                           example: 25
 *       400:
 *         description: Not enough fertilizer or tree not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: PUT /v1/garden/trees/:treeId/fertilize - Fertilize a tree
Router.route('/trees/:treeId/fertilize')
  .put(authMiddleware.isAuthorized, gardenController.fertilizeTree)

/**
 * @swagger
 * /v1/garden/trees/{treeId}/harvest:
 *   post:
 *     summary: Harvest a mature tree (Earns +50 XP, resets growth)
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tree ID
 *     responses:
 *       200:
 *         description: Tree harvested successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         garden:
 *                           $ref: '#/components/schemas/UserGarden'
 *                         experienceGained:
 *                           type: integer
 *                           example: 50
 *                         fruitsHarvested:
 *                           type: integer
 *                           example: 3
 *                         leveledUp:
 *                           type: boolean
 *       400:
 *         description: Tree not mature or not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: POST /v1/garden/trees/:treeId/harvest - Harvest a tree
Router.route('/trees/:treeId/harvest')
  .post(authMiddleware.isAuthorized, gardenController.harvestTree)

/**
 * @swagger
 * /v1/garden/shop/buy:
 *   post:
 *     summary: Buy items from garden shop (seeds, tools, decorations)
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - itemId
 *               - quantity
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [seed, tool, decoration, water, fertilizer]
 *                 example: seed
 *               itemId:
 *                 type: string
 *                 example: oak
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       200:
 *         description: Items purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         garden:
 *                           $ref: '#/components/schemas/UserGarden'
 *                         totalCost:
 *                           type: integer
 *                           example: 50
 *                         itemsPurchased:
 *                           type: object
 *                           example: { "oak_seeds": 5 }
 *       400:
 *         description: Not enough coins or invalid item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route: POST /v1/garden/shop/buy - Buy items (seeds, tools, decorations)
Router.route('/shop/buy')
  .post(authMiddleware.isAuthorized, gardenValidation.buyItem, gardenController.buyItem)

/**
 * @swagger
 * /v1/garden/decorations/place:
 *   post:
 *     summary: Place decoration in garden
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decorationId
 *               - position
 *             properties:
 *               decorationId:
 *                 type: string
 *                 example: garden_fountain
 *               position:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                     example: 150
 *                   y:
 *                     type: number
 *                     example: 200
 *     responses:
 *       200:
 *         description: Decoration placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserGarden'
 */
// Route: POST /v1/garden/decorations/place - Place decoration
Router.route('/decorations/place')
  .post(authMiddleware.isAuthorized, gardenValidation.placeDecoration, gardenController.placeDecoration)

/**
 * @swagger
 * /v1/garden/customize-tree:
 *   post:
 *     summary: Customize master tree design (name, color, pot, effects)
 *     tags: [Garden]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: My Eco Tree
 *               treeType:
 *                 type: string
 *                 enum: [oak, pine, bamboo, rose, cherry]
 *                 example: oak
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#4CAF50'
 *               potType:
 *                 type: string
 *                 enum: [ceramic, clay, plastic, wooden, golden]
 *                 example: ceramic
 *               potColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#D7CCC8'
 *               effects:
 *                 type: string
 *                 enum: [none, glow, sparkle, leaves, flowers]
 *                 example: sparkle
 *     responses:
 *       200:
 *         description: Tree customized successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserGarden'
 */
// Route: POST /v1/garden/customize-tree - Customize master tree design
Router.route('/customize-tree')
  .post(authMiddleware.isAuthorized, gardenController.customizeTree)

export const gardenRoute = Router