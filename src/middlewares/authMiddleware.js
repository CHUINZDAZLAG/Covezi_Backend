import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

// Critical middleware: Validate JWT access token for protected routes
const isAuthorized = async (req, res, next) => {
  // Extract access token from HTTP-only cookies (set by withCredentials in axios)
  const clientAccessToken = req.cookies?.accessToken

  // Reject request if no token is provided
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'))
    return
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

export const authMiddleware = { isAuthorized }