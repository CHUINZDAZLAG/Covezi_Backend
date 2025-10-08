import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { PRODUCT_CATEGORIES, PRODUCT_STATUS } from '~/utils/constants'

// Define collection name and schema
const PRODUCT_COLLECTION_NAME = 'products'
const PRODUCT_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().trim().strict(),
  description: Joi.string().required().trim(),
  shortDescription: Joi.string().trim(),
  category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).required(),
  price: Joi.number().required().min(0),
  discount: Joi.number().min(0).max(100).default(0),
  
  // Product images
  images: Joi.array().items(Joi.string()).default([]),
  thumbnail: Joi.string().default(''),
  
  // Product cover - default is Covezi-Product.png, can be overridden by admin upload
  cover: Joi.string().default('/assets/Covezi-Product.png'),
  
  // External shop links (Shopee, TikTok Shop, Facebook)
  links: Joi.object({
    shopee: Joi.string().uri().allow('').default(''),
    tiktok: Joi.string().uri().allow('').default(''),
    facebook: Joi.string().uri().allow('').default('')
  }).default({}),
  
  // Inventory
  stock: Joi.number().required().min(0).default(0),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)).default(PRODUCT_STATUS.ACTIVE),
  
  // SEO and metadata
  slug: Joi.string().trim(),
  
  // Sales metrics
  sold: Joi.number().min(0).default(0),
  views: Joi.number().min(0).default(0),
  rating: Joi.number().min(0).max(5).default(0),
  reviewCount: Joi.number().min(0).default(0),
  
  // Admin fields
  createdBy: Joi.string().required(), // User ID who created
  featured: Joi.boolean().default(false),
  
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdBy', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await PRODUCT_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdProduct = await GET_DB().collection(PRODUCT_COLLECTION_NAME).insertOne(validData)
    return createdProduct
  } catch (error) { throw new Error(error) }
}

const findOneById = async (productId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOne({ 
      _id: new ObjectId(productId),
      _destroy: false 
    })
    return result
  } catch (error) { throw new Error(error) }
}

const getDetails = async (productId) => {
  try {
    // Increment view count
    await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(productId), _destroy: false },
      { $inc: { views: 1 } }
    )
    
    const product = await findOneById(productId)
    return product
  } catch (error) { throw new Error(error) }
}

const getMany = async (queryObj, totalProductsPerPage = 10) => {
  try {
    const query = { _destroy: false }
    
    // Apply filters
    if (queryObj.category) query.category = queryObj.category
    if (queryObj.status) query.status = queryObj.status
    if (queryObj.featured !== undefined) query.featured = queryObj.featured === 'true'
    if (queryObj.minPrice) query.price = { ...query.price, $gte: parseFloat(queryObj.minPrice) }
    if (queryObj.maxPrice) query.price = { ...query.price, $lte: parseFloat(queryObj.maxPrice) }
    if (queryObj.inStock) query.stock = { $gt: 0 }
    
    // Search by name or description
    if (queryObj.search) {
      query.$or = [
        { name: { $regex: queryObj.search, $options: 'i' } },
        { description: { $regex: queryObj.search, $options: 'i' } },
        { tags: { $in: [new RegExp(queryObj.search, 'i')] } }
      ]
    }
    
    const products = await GET_DB()
      .collection(PRODUCT_COLLECTION_NAME)
      .aggregate([
        { $match: query },
        {
          $sort: queryObj.sortBy === 'price_asc' ? { price: 1 }
            : queryObj.sortBy === 'price_desc' ? { price: -1 }
            : queryObj.sortBy === 'newest' ? { createdAt: -1 }
            : queryObj.sortBy === 'popular' ? { sold: -1, views: -1 }
            : queryObj.sortBy === 'rating' ? { rating: -1 }
            : { createdAt: -1 }
        },
        { $skip: (queryObj.page - 1) * totalProductsPerPage },
        { $limit: totalProductsPerPage }
      ])
      .toArray()
    
    const totalProducts = await GET_DB().collection(PRODUCT_COLLECTION_NAME).countDocuments(query)
    
    return {
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / totalProductsPerPage),
      currentPage: queryObj.page
    }
  } catch (error) { throw new Error(error) }
}

const update = async (productId, updateData) => {
  try {
    // Remove invalid fields
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })
    
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(productId) },
      { $set: { ...updateData, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteOneById = async (productId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(productId) },
      { $set: { _destroy: true, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

export const productModel = {
  PRODUCT_COLLECTION_NAME,
  PRODUCT_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  getMany,
  update,
  deleteOneById
}