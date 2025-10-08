import express from 'express'
import { homepageController } from '~/controllers/homepageController'

const Router = express.Router()

// Route: GET /v1/homepage
Router.route('/')
  .get(homepageController.getHomepageData)

// Route: GET /v1/homepage/company
Router.route('/company')
  .get(homepageController.getCompanyInfo)

// Route: GET /v1/homepage/features
Router.route('/features')
  .get(homepageController.getFeatures)

// Route: GET /v1/homepage/promotions
Router.route('/promotions')
  .get(homepageController.getPromotions)

// Route: GET /v1/homepage/testimonials
Router.route('/testimonials')
  .get(homepageController.getTestimonials)

// Route: GET /v1/homepage/stats
Router.route('/stats')
  .get(homepageController.getStats)

// Route: GET /v1/homepage/news
Router.route('/news')
  .get(homepageController.getNews)

export const homepageRoute = Router