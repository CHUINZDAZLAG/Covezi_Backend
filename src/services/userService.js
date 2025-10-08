import { userModel } from '~/models/userModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { MailerSendProvider } from '~/providers/MailerSendProvider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    // Check if email is already registered in the system
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    // Prepare user data for database storage
    // Extract username from email (e.g., 'trander@gmail.com' → 'trander')
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8), // Hash with complexity level 8
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4(),
      isActive: env.BUILD_MODE === 'dev' ? true : false // Auto-active in dev mode
    }

    // Store user data in database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Send account verification email to user
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const to = getNewUser.email
    const toName = getNewUser.username
    const subject = 'Please vefiry your email before using our service!'
    const html = `
      <h1>Hello ${toName}</h1>
      <h2>Link to verify your account: ${verificationLink}.</h2>
      <h3>Regards, Trander</h3>
    `

    // // Custom data to assign in template
    // const personalizationData = [
    //   {
    //     email: to,
    //     data: {
    //       name: 'Trander',
    //       account_name: 'Trander25',
    //       account_image: 'https://trungquandev.com/wp-content/uploads/2024/03/white-bg-main-avatar-circle-min-trungquandev-codetq-375.jpeg'
    //     }
    //   }
    // ]

    // // Attachments
    // const attachments = [
    //   {
    //     filePath: 'src/files/test01.pdf',
    //     fileName: 'test01',
    //     attachmentType: 'attachment' // Truyen dung gia tri 'attachment' thi file se dc dinh kem cuoi email
    //   },
    //   {
    //     filePath: 'src/files/test02.png',
    //     fileName: 'test02',
    //     attachmentType: 'inline', // Truyen dung gia tri 'inline' thi file anh se dc dinh kem trong email
    //     fileId: '123' // dung cho html inline file
    //   }
    // ]
    // Execute email sending through MailerSend provider
    if (env.BUILD_MODE === 'production') {
      await MailerSendProvider.sendEmail({
        to,
        toName,
        subject,
        html
        // personalizationData
        // templateId: MAILERSEND_TEMPLATE_IDS.REGISTER_ACCOUNT // templateId cua email, khi co nhieu nen tach ra
      })
    }

    // Return sanitized user data excluding sensitive information
    return pickUser(getNewUser)
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
  } catch (error) { throw error}
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
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')

      // Store secure URL of uploaded image in database
      updatedUser = await userModel.update(existUser._id, {
        avatar: uploadResult.secure_url
      })
    } else {
      // Handle general profile information updates
      updatedUser = await userModel.update(existUser._id, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update
}