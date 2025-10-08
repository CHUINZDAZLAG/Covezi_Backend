import { StatusCodes } from 'http-status-codes'
import { homepageService } from '~/services/homepageService'

const getHomepageData = async (req, res, next) => {
  try {
    const homepageData = await homepageService.getHomepageData()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: homepageData
    })
  } catch (error) {
    next(error)
  }
}

const getCompanyInfo = async (req, res, next) => {
  try {
    const companyInfo = await homepageService.getCompanyInfo()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: companyInfo
    })
  } catch (error) {
    next(error)
  }
}

const getFeatures = async (req, res, next) => {
  try {
    const features = await homepageService.getFeatures()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: features
    })
  } catch (error) {
    next(error)
  }
}

const getPromotions = async (req, res, next) => {
  try {
    const promotions = await homepageService.getPromotions()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: promotions
    })
  } catch (error) {
    next(error)
  }
}

const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await homepageService.getTestimonials()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: testimonials
    })
  } catch (error) {
    next(error)
  }
}

const getStats = async (req, res, next) => {
  try {
    const stats = await homepageService.getStats()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getNews = async (req, res, next) => {
  try {
    const news = await homepageService.getNews()
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: news
    })
  } catch (error) {
    next(error)
  }
}

export const homepageController = {
  getHomepageData,
  getCompanyInfo,
  getFeatures,
  getPromotions,
  getTestimonials,
  getStats,
  getNews
}