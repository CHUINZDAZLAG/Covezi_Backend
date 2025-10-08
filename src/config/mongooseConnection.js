/* eslint-disable no-console */
import mongoose from 'mongoose'
import { env } from '~/config/environment'

let connectionRetries = 0
const MAX_RETRIES = 10

export const CONNECT_DB = async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    console.log('📍 MongoDB URI:', env.MONGODB_URI.substring(0, 50) + '...')
    
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 45000,
      waitQueueTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      // SSL options for Windows/development environments
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    })
    
    console.log('✅ Connected to MongoDB')
    console.log('✅ Connected to database:', env.DATABASE_NAME)
    connectionRetries = 0
  } catch (error) {
    connectionRetries++
    console.error(`❌ MongoDB connection failed (Attempt ${connectionRetries}/${MAX_RETRIES}):`)
    console.error('Error:', error?.message)
    
    if (error?.message?.includes('IP whitelist')) {
      console.error('⚠️  IP WHITELIST ERROR: Your IP is not whitelisted in MongoDB Atlas')
      console.error('📍 Go to: https://cloud.mongodb.com/v2 > Security > Network Access')
      console.error('📍 Add your IP or allow access from anywhere (0.0.0.0/0) for development')
    }
    
    if (connectionRetries < MAX_RETRIES) {
      console.log(`⏳ Retrying in 5 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      return CONNECT_DB()
    } else {
      console.error('❌ Failed to connect after all retries')
      throw error
    }
  }
}

export const GET_DB = () => {
  // For Mongoose, we return mongoose.connection
  // Mongoose automatically handles the db instance management
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    throw new Error('Must connect to Database first!')
  }
  return mongoose.connection.db || mongoose.connection
}

export const CLOSE_DB = async () => {
  console.log('4. Disconnecting from MongoDB Cloud Atlas...')
  await mongoose.disconnect()
  console.log('5. Disconnected from MongoDB Cloud Atlas')
}
