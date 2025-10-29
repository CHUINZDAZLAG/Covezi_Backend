import { userModel } from '~/models/userModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { SendGridProvider } from '~/providers/SendGridProvider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { PINVerificationHelper } from '~/utils/pinVerificationHelper'

const createNew = async (reqBody) => {
  try {
    // Check if email is already registered in the system
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser && existUser.isActive) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    // Generate 6-digit PIN
    const pin = PINVerificationHelper.generatePIN()
    const pinRecord = PINVerificationHelper.createPINRecord(pin)
    const registerVerificationToken = uuidv4()

    // Extract username from email (e.g., 'trander@gmail.com' → 'trander')
    const nameFromEmail = reqBody.email.split('@')[0]

    let newUser
    if (existUser && !existUser.isActive) {
      // Update existing inactive user with new PIN
      const updateData = {
        password: bcryptjs.hashSync(reqBody.password, 8),
        pinVerification: pinRecord,
        registerVerificationToken
      }
      newUser = await userModel.update(existUser._id, updateData)
    } else {
      // Create new user with PIN verification
      newUser = {
        email: reqBody.email,
        password: bcryptjs.hashSync(reqBody.password, 8),
        username: nameFromEmail,
        displayName: nameFromEmail,
        verifyToken: uuidv4(),
        pinVerification: pinRecord,
        registerVerificationToken,
        isActive: false
      }
      const createdUser = await userModel.createNew(newUser)
      newUser = await userModel.findOneById(createdUser.insertedId)
    }

    // Send PIN email to user
    const to = newUser.email
    const toName = newUser.username
    const subject = 'Xác nhận PIN đăng ký tài khoản - Covezi'
    const html = `
      <h1>Xin chào ${toName}</h1>
      <h2>Mã PIN xác nhận của bạn là: <strong style="font-size: 1.5em; color: #063B71;">${pin}</strong></h2>
      <p>Mã PIN này sẽ hết hạn trong 10 phút.</p>
      <p>Vui lòng nhập mã PIN này để hoàn tất quá trình đăng ký.</p>
      <p style="color: #999; font-size: 0.9em; margin-top: 2em;">Trân trọng,<br/>Đội ngũ Covezi</p>
    `

    // Execute email sending through SendGrid provider
    console.log('\n[userService.createNew] About to send PIN email...')
    try {
      console.log('[userService.createNew] Calling SendGridProvider.sendEmail()')
      const emailResult = await SendGridProvider.sendEmail({
        to,
        toName,
        subject,
        html
      })
      console.log(`[✅ Email Sent] PIN email sent to ${to}`)
    } catch (emailError) {
      console.error(`[❌ Email Failed] Error sending to ${to}`)
      console.error('Error Details:', {
        message: emailError?.message,
        statusCode: emailError?.statusCode,
        code: emailError?.code,
        responseBody: emailError?.response?.body,
        fullError: JSON.stringify(emailError)
      })
      // In DEV mode, print PIN to console for testing
      if (env.BUILD_MODE !== 'production') {
        console.log(`[🔐 DEV PIN] Email failed, but PIN is: ${pin}`)
      }
      // Don't throw - continue registration even if email fails
      // User can retry or use resend feature later
    }

    // Return token and email for frontend to use in next step
    return {
      registerVerificationToken,
      email: newUser.email,
      message: 'PIN has been sent to your email. Please check your inbox.'
    }
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    // Find user by email in database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Validate account verification prerequisites
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    }

    // Activate account and clear verification token
    const updateData = {
      isActive: true,
      verifyToken: null
    }

    // Apply account activation updates
    const updatedUser = await userModel.update(existUser._id, updateData)
    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const verifyPIN = async (reqBody) => {
  try {
    // Find user by registerVerificationToken
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    }

    if (reqBody.registerVerificationToken !== existUser.registerVerificationToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid verification token!')
    }

    if (!existUser.pinVerification) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'No PIN found for this account!')
    }

    // Validate PIN
    const pinValidation = PINVerificationHelper.validatePIN(existUser.pinVerification, reqBody.pin)

    if (!pinValidation.valid) {
      // Increment attempts if PIN is wrong
      if (pinValidation.remainingAttempts !== undefined) {
        const updatedPINRecord = PINVerificationHelper.incrementPINAttempts(existUser.pinVerification)
        await userModel.update(existUser._id, {
          pinVerification: updatedPINRecord
        })
      }
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, pinValidation.message)
    }

    // PIN is valid, activate account
    const updateData = {
      isActive: true,
      pinVerification: null,
      registerVerificationToken: null,
      verifyToken: null
    }

    const updatedUser = await userModel.update(existUser._id, updateData)
    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  try {
    // Find user account by email
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Validate login credentials and account status
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Email or Password is incorrect!')
    }

    // Generate JWT tokens for authenticated session
    // Create user payload for token generation (minimal data for security)
    const userInfo = {
      _id: existUser._id,
      email: existUser.email,
      role: existUser.role
    }

    // Generate dual-token authentication system (access + refresh tokens)
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    )

    // Return authentication tokens with sanitized user data
    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) { throw error}
}

const refreshToken = async (clientRefreshToken) => {
  try {
    // Verify and decode the refresh token to ensure it's valid
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    // Extract user info from decoded token (avoid database query for performance)
    // Since we store only immutable user data in tokens, we can safely reuse it
    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role
    }

    // Generate new access token with fresh expiration time
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE // Short-lived token (e.g., 1 hour)
    )

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    // Verify user exists and account is active
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    // Initialize variable for update result
    let updatedUser = {}

    // Handle password change with current password verification
    if (reqBody.current_password && reqBody.new_password) {
      // Verify current password before allowing change
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Current Password is incorrect!')
      }

      // Hash new password and update in database
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.new_password, 8)
      })
    } else if (userAvatarFile) {
      // Handle avatar upload to Cloudinary cloud storage
      try {
        const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')
        // Store secure URL of uploaded image in database
        updatedUser = await userModel.update(existUser._id, {
          avatar: uploadResult.secure_url
        })
      } catch (uploadErr) {
        console.error('[userService.update] Cloudinary upload failed:', uploadErr?.message)
        if (uploadErr?.message?.includes('timeout') || uploadErr?.statusCode === 504) {
          throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'Avatar upload timed out. Please try again with a smaller file.')
        }
        if (uploadErr?.message?.includes('ECONNRESET') || uploadErr?.message?.includes('ETIMEDOUT')) {
          throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Network error during upload. Please check your connection and try again.')
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Upload failed: ${uploadErr?.message || 'Unknown error'}`)
      }
    } else {
      // Handle general profile information updates
      updatedUser = await userModel.update(existUser._id, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) { 
    if (error instanceof ApiError) throw error
    throw error
  }
}

const testSendEmail = async (reqBody) => {
  try {
    const { email, subject = 'Test Email from Covezi', message = 'This is a test email' } = reqBody

    if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is required')
    }

    const html = `
      <h2>Test Email from Covezi</h2>
      <p>${message}</p>
      <p>If you receive this email, the SendGrid configuration is working correctly!</p>
      <p style="color: #999; font-size: 0.9em; margin-top: 2em;">Trân trọng,<br/>Đội ngũ Covezi</p>
    `

    const result = await SendGridProvider.sendEmail({
      to: email,
      toName: email.split('@')[0],
      subject,
      html
    })

    console.log('[Test Email Success]', result)
    
    return {
      success: true,
      message: `Test email sent to ${email}`,
      result
    }
  } catch (error) {
    console.error('[Test Email Error]', error)
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  verifyPIN,
  login,
  refreshToken,
  update
}