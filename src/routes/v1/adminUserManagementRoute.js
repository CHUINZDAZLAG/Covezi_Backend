/**
 * @swagger
 * tags:
 *   - name: Admin - User Management
 *     description: 👥 Admin user management, statistics, and moderation
 */

import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminUserManagementController } from '~/controllers/adminUserManagementController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

/**
 * @swagger
 * /v1/admin/users/stats:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: 📈 Get user statistics
 *     description: Get comprehensive user statistics and metrics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ✅ User statistics retrieved
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
 *                     totalUsers:
 *                       type: number
 *                       example: 12547
 *                     activeUsers:
 *                       type: number
 *                       example: 11203
 *                     newUsersThisMonth:
 *                       type: number
 *                       example: 342
 *                     averageLevel:
 *                       type: number
 *                       example: 8.5
 *                     topLevelUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           level:
 *                             type: number
 *                           totalXP:
 *                             type: number
 *                     usersByLevel:
 *                       type: object
 *                       properties:
 *                         "1-5":
 *                           type: number
 *                         "6-10":
 *                           type: number
 *                         "11-20":
 *                           type: number
 *                         "20+":
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
Router.route('/stats')
  .get(adminUserManagementController.getUserStats)

/**
 * @swagger
 * /v1/admin/users/signup/stats:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: 📊 Get signup statistics
 *     description: Get user registration statistics over time
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: ✅ Signup statistics retrieved
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
 *                     totalSignups:
 *                       type: number
 *                     dailySignups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: number
 *                     growthRate:
 *                       type: number
 *                       description: "Percentage growth compared to previous period"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
Router.route('/signup/stats')
  .get(adminUserManagementController.getSignupStats)

// GET /admin/users/login/stats - Get login statistics
Router.route('/login/stats')
  .get(adminUserManagementController.getLoginStats)

// PUT /admin/users/:userId/status - Update user status (activate/deactivate)
Router.route('/:userId/status')
  .put(adminUserManagementController.updateUserStatus)

// PUT /admin/users/:userId/role - Update user role
Router.route('/:userId/role')
  .put(adminUserManagementController.updateUserRole)

// DELETE /admin/users/:userId - Delete user
Router.route('/:userId')
  .delete(adminUserManagementController.deleteUser)

/**
 * @swagger
 * /v1/admin/users:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: 📋 Get all users
 *     description: Get paginated list of users with search, filter, and sorting options
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, email, or display name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by account status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, lastLogin, level, totalXP]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: ✅ Users retrieved successfully
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
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalUsers:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
Router.route('/')
  .get(adminUserManagementController.getAllUsers)

export const adminUserManagementRoute = Router
