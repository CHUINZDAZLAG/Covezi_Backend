import { StatusCodes } from 'http-status-codes'
import { productService } from '~/services/productService'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'

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

    // Handle file upload to Cloudinary
    // Note: req.files.coverImage is an array when using multer.fields()
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
      try {
        const coverImageFile = req.files.coverImage[0]
        // Use buffer if available (multer.fields() provides buffer), fallback to data
        const fileBuffer = coverImageFile.buffer || coverImageFile.data
        if (!fileBuffer || fileBuffer.length === 0) {
          throw new Error('File buffer is empty')
        }
        
        const uploadResult = await CloudinaryProvider.streamUpload(
          fileBuffer,
          'covezi/products'
        )
        // Store the Cloudinary URL
        bodyWithCreatedBy.cover = uploadResult.secure_url
        console.log('[DEBUG] Cloudinary upload successful:', uploadResult.secure_url)
      } catch (uploadError) {
        console.error('[DEBUG] Cloudinary upload failed:', uploadError.message)
        throw new ApiError(StatusCodes.BAD_REQUEST, `Image upload failed: ${uploadError.message}`)
      }
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

const getMyProducts = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const products = await productService.getMyProducts(userId, req.query)
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
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║           PRODUCT UPDATE CONTROLLER START               ║')
    console.log('╚════════════════════════════════════════════════════════╝')
    const { id } = req.params
    console.log('[UPDATE] Product ID:', id)
    console.log('[UPDATE] req.files exists?', !!req.files)
    console.log('[UPDATE] req.files type:', typeof req.files)
    if (req.files) {
      console.log('[UPDATE] req.files keys:', Object.keys(req.files))
      if (req.files.coverImage) {
        console.log('[UPDATE] coverImage received:', {
          fieldname: req.files.coverImage.fieldname,
          originalname: req.files.coverImage.originalname,
          mimetype: req.files.coverImage.mimetype,
          size: req.files.coverImage.size,
          encoding: req.files.coverImage.encoding
        })
      }
    }
    console.log('[UPDATE] req.body keys:', Object.keys(req.body))

    // Parse links if it's a JSON string
    let bodyData = { ...req.body }
    if (bodyData.links && typeof bodyData.links === 'string') {
      bodyData.links = JSON.parse(bodyData.links)
    }

    // Handle file upload to Cloudinary
    // Note: req.files.coverImage is an array when using multer.fields()
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
      try {
        const coverImageFile = req.files.coverImage[0]
        console.log('[UPDATE] File object received:',  {
          fieldname: coverImageFile.fieldname,
          originalname: coverImageFile.originalname,
          encoding: coverImageFile.encoding,
          mimetype: coverImageFile.mimetype,
          size: coverImageFile.size,
          hasBuffer: !!coverImageFile.buffer,
          bufferSize: coverImageFile.buffer ? coverImageFile.buffer.length : 0,
          hasData: !!coverImageFile.data,
          dataSize: coverImageFile.data ? coverImageFile.data.length : 0
        })
        
        // Use buffer if available (multer.fields() provides buffer), fallback to data
        const fileBuffer = coverImageFile.buffer || coverImageFile.data
        if (!fileBuffer || fileBuffer.length === 0) {
          throw new Error('File buffer is empty')
        }
        
        console.log('[UPDATE] Starting Cloudinary upload for:', coverImageFile.originalname)
        const uploadResult = await CloudinaryProvider.streamUpload(
          fileBuffer,
          'covezi/products'
        )
        // Store the Cloudinary URL
        bodyData.cover = uploadResult.secure_url
        console.log('[UPDATE] ✅ Cloudinary upload successful:', uploadResult.secure_url)
      } catch (uploadError) {
        console.error('[UPDATE] ❌ Cloudinary upload failed:', uploadError.message)
        throw new ApiError(StatusCodes.BAD_REQUEST, `Image upload failed: ${uploadError.message}`)
      }
    } else {
      console.log('[UPDATE] ℹ️ No new coverImage file provided - keeping existing image')
    }

    console.log('[UPDATE] bodyData.cover final value:', bodyData.cover)
    console.log('[UPDATE] bodyData.name:', bodyData.name)
    console.log('[UPDATE] bodyData.price:', bodyData.price)
    console.log('[UPDATE] Calling productService.update...')
    const updatedProduct = await productService.update(id, bodyData)
    console.log('[UPDATE] ✅ Product updated successfully')
    console.log('[UPDATE] Response cover field:', updatedProduct?.cover)
    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║           PRODUCT UPDATE CONTROLLER END                 ║')
    console.log('╚════════════════════════════════════════════════════════╝\n')
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProduct
    })
  } catch (error) { 
    console.error('[UPDATE] ❌ Error in update:', error.message)
    console.error('[UPDATE] Error stack:', error.stack)
    next(error) 
  }
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

const getStats = async (req, res, next) => {
  try {
    const stats = await productService.getStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) { next(error) }
}

export const productController = {
  createNew,
  getDetails,
  getMany,
  getMyProducts,
  getFeatured,
  getCategories,
  searchProducts,
  update,
  updateStock,
  deleteItem,
  getStats
}