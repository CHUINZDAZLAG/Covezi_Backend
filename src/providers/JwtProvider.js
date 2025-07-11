import JWT from 'jsonwebtoken'

// Function generate token need 3 parametters: userInfo, secretSignature(privateKey), tokenLife
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) { throw new Error(error)}
}

// Check if a token is valid by checking secretSignature(privateKey)
const verifyToken = async (token, secretSignature) => {
  try {
    return JWT.verify(token, secretSignature)
  } catch (error) { throw new Error(error)}
}

export const JwtProvider = {
  generateToken,
  verifyToken
}