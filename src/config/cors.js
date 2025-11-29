import { WHITELIST_DOMAINS } from '~/utils/constants'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Configure CORS (Cross-Origin Resource Sharing) options for production environment
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development mode for easier testing
    if (env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    // Validate origin against whitelist of approved domains
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // Reject requests from unauthorized domains with forbidden status
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // Enable credential sharing (cookies, authorization headers) across origins
  credentials: true,
  
  // Allow headers needed for cross-origin requests
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // Include Authorization header in CORS requests
  exposedHeaders: ['Authorization']
}
