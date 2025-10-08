import { StatusCodes } from 'http-status-codes'
import { productService } from '~/services/productService'

const createNew = async (req, res, next) => {
  try {
    console.log('[DEBUG] createNew called')
    console.log('[DEBUG] Content-Type:', req.headers['content-type'])
    console.log('[DEBUG] req.body keys:', Object.keys(req.body))
    console.log('[DEBUG] req.body: ', req.body)
    console.log('[DEBUG] req.files: ', req.files)
    console.log('[DEBUG] req.jwtDecoded: ', req.jwtDecoded)

    // Parse links if it's a JSON string
    let bodyData = { ...req.body }
    if (bodyData.links && typeof bodyData.links === 'string') {
      bodyData.links = JSON.parse(bodyData.links)
    }

    // Add createdBy from JWT
    const bodyWithCreatedBy = {
      ...bodyData,
      createdBy: req.jwtDecoded._id
    }

    console.log('[DEBUG] bodyWithCreatedBy: ', bodyWithCreatedBy)

    // Điều hướng dữ liệu sang tầng Service
    const createdProduct = await productService.createNew(bodyWithCreatedBy)

    // Có kết quả thì trả về phía Client
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdProduct
    })
  } catch (error) { 
    console.log('[DEBUG] Error in createNew:', error.message)
    console.log('[DEBUG] Error stack:', error.stack)
    next(error) 
  }
}

const getDetails = async (req, res, next) => {
  try {
    console.log('req.params: ', req.params)
    const { id } = req.params

    const product = await productService.getDetails(id)
    
    // Increment view count
    await productService.incrementView(id)
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: product
    })
  } catch (error) { next(error) }
}

const getMany = async (req, res, next) => {
  try {
    const products = await productService.getMany(req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      data: products
    })
  } catch (error) { next(error) }
}

const getFeatured = async (req, res, next) => {
  try {
    const { limit } = req.query
    const products = await productService.getFeatured(parseInt(limit) || 8)
    res.status(StatusCodes.OK).json({
      success: true,
      data: products
    })
  } catch (error) { next(error) }
}

const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories()
    res.status(StatusCodes.OK).json({
      success: true,
      data: categories
    })
  } catch (error) { next(error) }
}

const searchProducts = async (req, res, next) => {
  try {
    const { q: searchQuery, ...filters } = req.query
    const results = await productService.searchProducts(searchQuery, filters)
    res.status(StatusCodes.OK).json({
      success: true,
      data: results
    })
  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params

    // Parse links if it's a JSON string
    let bodyData = { ...req.body }
    if (bodyData.links && typeof bodyData.links === 'string') {
      bodyData.links = JSON.parse(bodyData.links)
    }

    const updatedProduct = await productService.update(id, bodyData)
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProduct
    })
  } catch (error) { next(error) }
}

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params
    const { quantity } = req.body
    
    const updatedProduct = await productService.updateStock(id, quantity)
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProduct
    })
  } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params
    
    await productService.deleteItem(id)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) { next(error) }
}

export const productController = {
  createNew,
  getDetails,
  getMany,
  getFeatured,
  getCategories,
  searchProducts,
  update,
  updateStock,
  deleteItem
}