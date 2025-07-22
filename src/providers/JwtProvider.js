import JWT from 'jsonwebtoken'

// Generate JWT token with user information, secret signature, and expiration time
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) { throw new Error(error)}
}

// Verify JWT token authenticity and return decoded payload if valid
const verifyToken = async (token, secretSignature) => {
  try {
    return JWT.verify(token, secretSignature)
  } catch (error) { throw new Error(error)}
}

export const JwtProvider = {
  generateToken,
  verifyToken
}