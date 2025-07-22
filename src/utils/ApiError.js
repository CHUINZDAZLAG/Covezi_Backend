class ApiError extends Error {
  constructor(statusCode, message) {
    // Call parent Error constructor to inherit base error functionality
    // Pass message to parent constructor for proper error handling
    super(message)

    // Set custom error name to distinguish from generic Error instances
    this.name = 'ApiError'

    // Attach HTTP status code for proper API response handling
    this.statusCode = statusCode

    // Capture stack trace for debugging purposes, excluding constructor from trace
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError