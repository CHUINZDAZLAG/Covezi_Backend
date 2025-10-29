import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute'
import { homepageRoute } from './homepageRoute'
import { productRoute } from './productRoute'
import { challengeRoute } from './challengeRoute'
import { gardenRoute } from './gardenRoute'
import { gamificationRoutes } from './gamificationRoutes'
import { voucherRoute } from './voucherRoute'
import { adminVoucherConfigRoute } from './adminVoucherConfigRoute'
import { adminChallengeRoute } from './adminChallengeRoute'
import { adminUserVoucherHistoryRoute } from './adminUserVoucherHistoryRoute'
import { adminUserManagementRoute } from './adminUserManagementRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

// User API
Router.use('/users', userRoute)

// Covezi Platform APIs
// Homepage API
Router.use('/homepage', homepageRoute)

// Product API
Router.use('/products', productRoute)

// Challenge API (with likes and proof comments)
Router.use('/challenges', challengeRoute)

// Garden API
Router.use('/garden', gardenRoute)

// Gamification API
Router.use('/gamification', gamificationRoutes)

// Voucher API
Router.use('/vouchers', voucherRoute)

// Admin Voucher Config API
Router.use('/admin/voucher-config', adminVoucherConfigRoute)

// Admin Challenge API
Router.use('/admin/challenges', adminChallengeRoute)

// Admin User Voucher History API
Router.use('/admin/voucher-history', adminUserVoucherHistoryRoute)

// Admin User Management API
Router.use('/admin/users', adminUserManagementRoute)

export const APIs_V1 = Router