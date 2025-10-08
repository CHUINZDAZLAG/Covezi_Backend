import express from 'express'
import { productController } from '~/controllers/productController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { productValidation } from '~/validations/productValidation'

const Router = express.Router()

// Route: GET /v1/products - Get products with filtering, pagination
Router.route('/')
  .get(productController.getMany)
  .post(authMiddleware.isAuthorized, authMiddleware.isAdmin, multerUploadMiddleware.uploadAny(), productValidation.createNew, productController.createNew)

// Route: GET /v1/products/featured - Get featured products
Router.route('/featured')
  .get(productController.getFeatured)

// Route: GET /v1/products/categories - Get product categories
Router.route('/categories')
  .get(productController.getCategories)

// Route: GET /v1/products/search - Search products
Router.route('/search')
  .get(productController.searchProducts)

// Route: GET, PUT, DELETE /v1/products/:id
Router.route('/:id')
  .get(productController.getDetails)
  .put(authMiddleware.isAuthorized, authMiddleware.isAdmin, multerUploadMiddleware.uploadAny(), productValidation.update, productController.update)
  .delete(authMiddleware.isAuthorized, authMiddleware.isAdmin, productController.deleteItem)

// Route: PUT /v1/products/:id/stock - Update product stock (admin only)
Router.route('/:id/stock')
  .put(authMiddleware.isAuthorized, authMiddleware.isAdmin, productValidation.updateStock, productController.updateStock)

export const productRoute = Router