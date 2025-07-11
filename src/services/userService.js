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

const createNew = async (reqBody) => {
  try {
    // Check if the email already exists
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    // Create data to store database
    // nameFromEmail: if email is trander@gamil.com so we get 'trander'
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8), // 8 is complexity of algorithms
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    // Store data in database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Send email to user verification
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
    // Call Provider to send email
    const mailerSend = await MailerSendProvider.sendEmail({
      to,
      toName,
      subject,
      html
      // personalizationData
      // templateId: MAILERSEND_TEMPLATE_IDS.REGISTER_ACCOUNT // templateId cua email, khi co nhieu nen tach ra
    })

    // return data for controller which specific fields
    return pickUser(getNewUser)
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    // Query user in database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Check some data
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    }

    // Update user's data to verify account
    const updateData = {
      isActive: true,
      verifyToken: null
    }

    // Update
    const updatedUser = await userModel.update(existUser._id, updateData)
    return pickUser(updatedUser)
  } catch (error) { throw error}
}

const login = async (reqBody) => {
  try {
    // Query user in database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Check some data
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Email or Password is incorrect!')
    }

    // If everything is OK, start creating login tokens to return to the FE (Frontend)
    // Create information to be attached in JWT Token includes _id and email of the user
    const userInfo = {
      _id: existUser._id,
      email: existUser.email
    }

    // Create 2 types of tokens, accessToken and refreshToken, to return to the FE
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5,
      env.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    )

    // Return user information along with the 2 newly created tokens
    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) { throw error}
}

export const userService = {
  createNew,
  verifyAccount,
  login
}