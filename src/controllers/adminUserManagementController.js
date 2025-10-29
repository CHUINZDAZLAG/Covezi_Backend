import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'

class AdminUserManagementController {
  /**
   * Get all users with statistics
   * GET /admin/users - Get all users
   */
  static async getAllUsers(req, res, next) {
    try {
      const { search, role, isActive, page = 1, limit = 20 } = req.query
      
      // Build filter object
      const filter = { _destroy: false }
      
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (role) {
        filter.role = role
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true
      }

      // Get total count
      const totalUsers = await userModel.countDocuments(filter)
      
      // Calculate pagination
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      const skip = (pageNum - 1) * limitNum
      
      // Get paginated users
      const users = await userModel.findAll(filter, {
        skip,
        limit: limitNum,
        sort: { createdAt: -1 }
      })

      // Calculate stats
      const adminCount = await userModel.countDocuments({ ...filter, role: 'admin', _destroy: false })
      const clientCount = await userModel.countDocuments({ ...filter, role: 'client', _destroy: false })
      const activeCount = await userModel.countDocuments({ ...filter, isActive: true, _destroy: false })
      const inactiveCount = await userModel.countDocuments({ ...filter, isActive: false, _destroy: false })

      res.status(StatusCodes.OK).json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limitNum)
        },
        stats: {
          totalUsers,
          adminCount,
          clientCount,
          activeCount,
          inactiveCount
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Get user statistics dashboard
   * GET /admin/users/stats - Get user statistics
   */
  static async getUserStats(req, res, next) {
    try {
      // Total users
      const totalUsers = await userModel.countDocuments({ _destroy: false })
      
      // Count by role
      const adminCount = await userModel.countDocuments({ role: 'admin', _destroy: false })
      const clientCount = await userModel.countDocuments({ role: 'client', _destroy: false })
      
      // Count by status
      const activeUsers = await userModel.countDocuments({ isActive: true, _destroy: false })
      const inactiveUsers = await userModel.countDocuments({ isActive: false, _destroy: false })
      const unverifiedUsers = await userModel.countDocuments({ isActive: false, _destroy: false })
      
      // Get signup trend (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentSignups = await userModel.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        _destroy: false
      })
      
      // Get login statistics (last login tracking)
      const recentlyActive = await userModel.countDocuments({
        isActive: true,
        _destroy: false
      })

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalAdmins: adminCount,
            totalClients: clientCount,
            activeUsers,
            inactiveUsers,
            unverifiedUsers
          },
          trends: {
            recentSignups,
            recentlyActive
          },
          breakdown: {
            byRole: {
              admin: adminCount,
              client: clientCount
            },
            byStatus: {
              active: activeUsers,
              inactive: inactiveUsers,
              unverified: unverifiedUsers
            }
          }
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Delete a user
   * DELETE /admin/users/:userId
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params
      const adminId = req.jwtDecoded._id

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      // Prevent deleting self
      if (userId === adminId.toString()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot delete your own account')
      }

      // Prevent deleting other admins (optional - based on business logic)
      if (user.role === 'admin') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Cannot delete admin accounts')
      }

      // Soft delete the user
      const deletedUser = await userModel.update(userId, {
        _destroy: true,
        deletedAt: new Date(),
        deletedBy: adminId
      })

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'User deleted successfully',
        data: deletedUser
      })
    } catch (error) { next(error) }
  }

  /**
   * Update user status (activate/deactivate)
   * PUT /admin/users/:userId/status
   */
  static async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params
      const { isActive } = req.body

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      if (typeof isActive !== 'boolean') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'isActive must be a boolean')
      }

      const updatedUser = await userModel.update(userId, { isActive })

      res.status(StatusCodes.OK).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedUser
      })
    } catch (error) { next(error) }
  }

  /**
   * Update user role
   * PUT /admin/users/:userId/role
   */
  static async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params
      const { role } = req.body
      const adminId = req.jwtDecoded._id

      if (!['admin', 'client'].includes(role)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid role. Must be admin or client')
      }

      // Verify user exists
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      // Prevent changing self role
      if (userId === adminId.toString()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot change your own role')
      }

      const updatedUser = await userModel.update(userId, { role })

      res.status(StatusCodes.OK).json({
        success: true,
        message: `User role updated to ${role}`,
        data: updatedUser
      })
    } catch (error) { next(error) }
  }

  /**
   * Get signup statistics
   * GET /admin/users/signup/stats
   */
  static async getSignupStats(req, res, next) {
    try {
      const { days = 30 } = req.query
      
      const daysNum = parseInt(days)
      const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000)
      
      // Get daily signup counts
      const signups = await userModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            _destroy: false
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      res.status(StatusCodes.OK).json({
        success: true,
        data: signups,
        summary: {
          totalSignups: signups.reduce((sum, day) => sum + day.count, 0),
          days: daysNum
        }
      })
    } catch (error) { next(error) }
  }

  /**
   * Get login statistics
   * GET /admin/users/login/stats
   */
  static async getLoginStats(req, res, next) {
    try {
      // Count active vs inactive users
      const activeCount = await userModel.countDocuments({ isActive: true, _destroy: false })
      const inactiveCount = await userModel.countDocuments({ isActive: false, _destroy: false })
      const totalCount = await userModel.countDocuments({ _destroy: false })

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          activeUsers: activeCount,
          inactiveUsers: inactiveCount,
          totalUsers: totalCount,
          activePercentage: ((activeCount / totalCount) * 100).toFixed(2)
        }
      })
    } catch (error) { next(error) }
  }
}

export const adminUserManagementController = AdminUserManagementController
