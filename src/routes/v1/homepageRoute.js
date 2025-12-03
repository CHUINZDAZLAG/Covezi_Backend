/**
 * @swagger
 * tags:
 *   - name: Homepage
 *     description: 🏠 Homepage data, company info, features, and public content
 */

import express from 'express'
import { homepageController } from '~/controllers/homepageController'

const Router = express.Router()

/**
 * @swagger
 * /v1/homepage:
 *   get:
 *     tags: [Homepage]
 *     summary: 🏠 Get complete homepage data
 *     description: Retrieve all homepage sections - hero, features, stats, testimonials, promotions in one call
 *     responses:
 *       200:
 *         description: ✅ Homepage data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hero:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: "Shop Eco-Friendly, Live Sustainably"
 *                         subtitle:
 *                           type: string
 *                         ctaText:
 *                           type: string
 *                         backgroundImage:
 *                           type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         totalOrders:
 *                           type: number
 *                         totalProducts:
 *                           type: number
 *                         co2Saved:
 *                           type: string
 *                     featuredProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     promotions:
 *                       type: array
 *                     testimonials:
 *                       type: array
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
Router.route('/')
  .get(homepageController.getHomepageData)

/**
 * @swagger
 * /v1/homepage/company:
 *   get:
 *     tags: [Homepage]
 *     summary: 🏢 Get company information
 *     description: Retrieve company details, mission, vision, team info, and contact details
 *     responses:
 *       200:
 *         description: ✅ Company info retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Covezi"
 *                     mission:
 *                       type: string
 *                     vision:
 *                       type: string
 *                     foundedYear:
 *                       type: number
 *                     teamSize:
 *                       type: number
 *                     headquarters:
 *                       type: string
 *                     contact:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         address:
 *                           type: string
 */
Router.route('/company')
  .get(homepageController.getCompanyInfo)

/**
 * @swagger
 * /v1/homepage/features:
 *   get:
 *     tags: [Homepage]
 *     summary: ✨ Get platform features
 *     description: Get list of key features and capabilities of the Covezi platform
 *     responses:
 *       200:
 *         description: ✅ Features retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "AI-Powered Eco Recommendations"
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       category:
 *                         type: string
 *                         example: "AI & Technology"

 * /v1/homepage/promotions:
 *   get:
 *     tags: [Homepage]
 *     summary: 🎁 Get current promotions
 *     description: Get active promotions, sales, and special offers
 *     responses:
 *       200:
 *         description: ✅ Promotions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       discountPercent:
 *                         type: number
 *                       validUntil:
 *                         type: number
 *                       bannerImage:
 *                         type: string

 * /v1/homepage/stats:
 *   get:
 *     tags: [Homepage]
 *     summary: 📈 Get platform statistics
 *     description: Get real-time platform metrics and impact data
 *     responses:
 *       200:
 *         description: ✅ Stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 12547
 *                         activeThisMonth:
 *                           type: number
 *                     orders:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                     environmental:
 *                       type: object
 *                       properties:
 *                         co2Saved:
 *                           type: string
 *                           example: "2.4 tons"
 *                         treesPlanted:
 *                           type: number
 *                           example: 1247
 */
Router.route('/features')
  .get(homepageController.getFeatures)

Router.route('/promotions')
  .get(homepageController.getPromotions)

Router.route('/testimonials')
  .get(homepageController.getTestimonials)

Router.route('/stats')
  .get(homepageController.getStats)

Router.route('/news')
  .get(homepageController.getNews)

export const homepageRoute = Router