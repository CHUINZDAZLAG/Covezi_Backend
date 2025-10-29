import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { adminUserManagementController } from '~/controllers/adminUserManagementController'

const Router = express.Router()

// All routes require authentication + admin role
Router.use(authMiddleware.isAuthorized, authMiddleware.isAdmin)

// Define more specific routes BEFORE general ones
// GET /admin/users/stats - Get user statistics
Router.route('/stats')
  .get(adminUserManagementController.getUserStats)

// GET /admin/users/signup/stats - Get signup statistics
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

// GET /admin/users - Get all users (with filters, search, pagination) - MUST BE LAST
Router.route('/')
  .get(adminUserManagementController.getAllUsers)

export const adminUserManagementRoute = Router
