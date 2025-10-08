import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
import ms from 'ms'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) { next(error) }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)
    /**
     * Set HTTP-only cookies for secure token storage in browser
     * Reference: https://expressjs.com/en/api.html
     * Note: Cookie maxAge (14 days) is separate from token expiration time
     * This provides additional security layer for token management
     */
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.BUILD_MODE === 'production', // Only require HTTPS in production
      sameSite: process.env.BUILD_MODE === 'production' ? 'none' : 'lax', // 'lax' for localhost
      maxAge: ms('14 days')
    }
    
    res.cookie('accessToken', result.accessToken, cookieOptions)
    res.cookie('refreshToken', result.refreshToken, cookieOptions)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const logout = async (req, res, next) => {
  try {
    // Clear authentication cookies to complete logout process
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.BUILD_MODE === 'production',
      sameSite: process.env.BUILD_MODE === 'production' ? 'none' : 'lax'
    }
    
    res.clearCookie('accessToken', cookieOptions)
    res.clearCookie('refreshToken', cookieOptions)

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.BUILD_MODE === 'production',
      sameSite: process.env.BUILD_MODE === 'production' ? 'none' : 'lax',
      maxAge: ms('14 days')
    }
    
    res.cookie('accessToken', result.accessToken, cookieOptions)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please Sign In! (Error from refresh Token)'))
  }
}

const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const userAvatarFile = req.file
    const updatedUser = await userService.update(userId, req.body, userAvatarFile)

    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) { next(error) }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update
}