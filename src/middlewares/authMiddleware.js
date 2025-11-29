import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

// Critical middleware: Validate JWT access token for protected routes
const isAuthorized = async (req, res, next) => {
  // Extract access token from HTTP-only cookies OR Authorization header
  // First try to get from cookies (for same-origin requests)
  let clientAccessToken = req.cookies?.accessToken
  
  // If no token in cookies, try Authorization header (for cross-origin requests from frontend)
  if (!clientAccessToken) {
    const authHeader = req.headers?.authorization
    console.log('[AUTH] Full auth header:', authHeader)
    console.log('[AUTH] Authorization header type:', typeof authHeader)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      clientAccessToken = authHeader.substring(7) // Remove 'Bearer ' prefix
      console.log('[AUTH] Extracted token from header:', clientAccessToken.substring(0, 20) + '...')
    }
  }

  // Debug logging
  console.log('[AUTH] Authorization header:', req.headers?.authorization?.substring(0, 20) + '...')
  console.log('[AUTH] Cookie token:', req.cookies?.accessToken?.substring(0, 20) + '...')
  console.log('[AUTH] Using token source:', clientAccessToken ? (req.cookies?.accessToken ? 'cookie' : 'header') : 'none')

  // Reject request if no token is provided
  if (!clientAccessToken) {
    console.log('[AUTH] FAILED - No token found')
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'))
    return
  }
  
  console.log('[AUTH] Token found, verifying...')
  try {
    // Step 1: Verify and decode the JWT access token
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    console.log('[AUTH] Token verified successfully:', accessTokenDecoded._id)

    // Step 2: Attach decoded user info to request object for downstream use
    req.jwtDecoded = accessTokenDecoded

    // Step 3: Allow request to proceed to next middleware/route handler
    next()
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error.message)
    // Handle expired token: Return 410 GONE to trigger refresh token flow
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }

    // Handle invalid token: Return 401 UNAUTHORIZED to trigger re-authentication
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}
  try {
    // Step 1: Verify and decode the JWT access token
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)

    // Step 2: Attach decoded user info to request object for downstream use
    req.jwtDecoded = accessTokenDecoded

    // Step 3: Allow request to proceed to next middleware/route handler
    next()
  } catch (error) {
    // Handle expired token: Return 410 GONE to trigger refresh token flow
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }

    // Handle invalid token: Return 401 UNAUTHORIZED to trigger re-authentication
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}

// Optional authorization - doesn't require token but decodes if present
const isAuthorizedOptional = async (req, res, next) => {
  // Extract access token from cookies OR Authorization header
  let clientAccessToken = req.cookies?.accessToken
  
  if (!clientAccessToken) {
    const authHeader = req.headers?.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      clientAccessToken = authHeader.substring(7)
    }
  }

  // If no token, just continue without user info
  if (!clientAccessToken) {
    req.jwtDecoded = null
    next()
    return
  }

  try {
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    req.jwtDecoded = accessTokenDecoded
    next()
  } catch (error) {
    // Token invalid/expired - continue without user info
    req.jwtDecoded = null
    next()
  }
}

// Middleware to verify user is admin
const isAdmin = (req, res, next) => {
  if (!req.jwtDecoded) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated'))
  }
  
  console.log('[DEBUG isAdmin] req.jwtDecoded:', req.jwtDecoded)
  
  // Check if role exists in JWT, if not check email fallback
  const userRole = req.jwtDecoded.role
  const userEmail = req.jwtDecoded.email
  const isAdminUser = userRole === 'admin' || userEmail?.includes('admin')
  
  console.log('[DEBUG isAdmin] userRole:', userRole, 'userEmail:', userEmail, 'isAdminUser:', isAdminUser)
  
  if (!isAdminUser) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Admin access required'))
  }
  
  next()
}

// Middleware to verify user is client
const isClient = (req, res, next) => {
  if (!req.jwtDecoded) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated'))
  }
  
  if (req.jwtDecoded.role !== 'client') {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Client access required'))
  }
  
  next()
}

// Middleware to check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.jwtDecoded) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated'))
    }
    
    // Define permissions based on role
    const adminPermissions = [
      'product.create',
      'product.read',
      'product.update',
      'product.delete',
      'voucher.manage',
      'voucher.confirm',
      'user.manage'
    ]
    
    const clientPermissions = [
      'product.read',
      'voucher.view',
      'voucher.use'
    ]
    
    const userPermissions = req.jwtDecoded.role === 'admin' || req.jwtDecoded.email?.includes('admin') ? adminPermissions : clientPermissions
    
    if (!userPermissions.includes(permission)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, `Permission '${permission}' required`))
    }
    
    next()
  }
}

export const authMiddleware = { isAuthorized, isAuthorizedOptional, isAdmin, isClient, requirePermission }