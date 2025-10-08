import { productModel } from '~/models/productModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Generate slug from product name
    if (!reqBody.slug && reqBody.name) {
      reqBody.slug = slugify(reqBody.name)
    }
    
    // Note: createdBy should be added by controller passing req.jwtDecoded.userId
    const newProduct = {
      ...reqBody,
      createdAt: Date.now()
    }
    
    const createdProduct = await productModel.createNew(newProduct)
    const getNewProduct = await productModel.findOneById(createdProduct.insertedId)
    
    return getNewProduct
  } catch (error) {
    throw error
  }
}

const getDetails = async (productId) => {
  try {
    const product = await productModel.getDetails(productId)
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    return product
  } catch (error) {
    throw error
  }
}

const getMany = async (query) => {
  try {
    // Set default values
    const queryObj = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 12,
      category: query.category,
      status: query.status || 'active',
      featured: query.featured,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
      search: query.search,
      sortBy: query.sortBy || 'newest'
    }
    
    const results = await productModel.getMany(queryObj, queryObj.limit)
    return results
  } catch (error) {
    throw error
  }
}

const getFeatured = async (limit = 8) => {
  try {
    const results = await productModel.getMany(
      { page: 1, featured: 'true', status: 'active' },
      limit
    )
    return results.products
  } catch (error) {
    throw error
  }
}

const getCategories = async () => {
  try {
    // Get distinct categories from products
    const categories = await productModel.getMany({ page: 1 }, 1000)
    const categorySet = new Set()
    
    categories.products.forEach(product => {
      categorySet.add(product.category)
    })
    
    return Array.from(categorySet).map(category => ({
      value: category,
      label: getCategoryLabel(category),
      count: categories.products.filter(p => p.category === category).length
    }))
  } catch (error) {
    throw error
  }
}

const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const queryObj = {
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 20,
      search: searchQuery,
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy || 'relevance'
    }
    
    const results = await productModel.getMany(queryObj, queryObj.limit)
    return results
  } catch (error) {
    throw error
  }
}

const update = async (productId, updateData) => {
  try {
    const existingProduct = await productModel.findOneById(productId)
    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    // Update slug if name changed
    if (updateData.name && updateData.name !== existingProduct.name) {
      updateData.slug = slugify(updateData.name)
    }
    
    const updatedProduct = await productModel.update(productId, updateData)
    return updatedProduct
  } catch (error) {
    throw error
  }
}

const deleteItem = async (productId) => {
  try {
    const existingProduct = await productModel.findOneById(productId)
    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    const deletedProduct = await productModel.deleteOneById(productId)
    return deletedProduct
  } catch (error) {
    throw error
  }
}

const updateStock = async (productId, quantity) => {
  try {
    const existingProduct = await productModel.findOneById(productId)
    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    const newStock = existingProduct.stock + quantity
    if (newStock < 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient stock!')
    }
    
    const updateData = { 
      stock: newStock,
      status: newStock === 0 ? 'out-of-stock' : 'active'
    }
    
    const updatedProduct = await productModel.update(productId, updateData)
    return updatedProduct
  } catch (error) {
    throw error
  }
}

const incrementView = async (productId) => {
  try {
    const existingProduct = await productModel.findOneById(productId)
    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    const updatedProduct = await productModel.update(productId, {
      views: existingProduct.views + 1
    })
    return updatedProduct
  } catch (error) {
    throw error
  }
}

const updateRating = async (productId, newRating, reviewCount) => {
  try {
    const existingProduct = await productModel.findOneById(productId)
    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
    }
    
    // Calculate new average rating
    const currentTotal = existingProduct.rating * existingProduct.reviewCount
    const newTotal = currentTotal + newRating
    const newCount = existingProduct.reviewCount + 1
    const newAverageRating = newTotal / newCount
    
    const updatedProduct = await productModel.update(productId, {
      rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
      reviewCount: newCount
    })
    return updatedProduct
  } catch (error) {
    throw error
  }
}

// Helper function to get category labels in Vietnamese
const getCategoryLabel = (category) => {
  const labels = {
    'eco-friendly': 'Thân thiện môi trường',
    'organic': 'Hữu cơ',
    'recycled': 'Tái chế',
    'sustainable': 'Bền vững'
  }
  return labels[category] || category
}

export const productService = {
  createNew,
  getDetails,
  getMany,
  getFeatured,
  getCategories,
  searchProducts,
  update,
  deleteItem,
  updateStock,
  incrementView,
  updateRating
}