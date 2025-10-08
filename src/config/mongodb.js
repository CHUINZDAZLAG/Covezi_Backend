/* eslint-disable no-console */
import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

let trelloDatabaseInstance = null

// Initialize MongoDB client instance for database connection
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false
  },
  // Optimized connection options for MongoDB Atlas
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 45000,
  waitQueueTimeoutMS: 10000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  journal: true,
  // TLS options - use only tlsAllowInvalidCertificates
  tls: true,
  tlsAllowInvalidCertificates: true,
  // IPv4 preference
  family: 4,
  // Enable direct connection if needed
  directConnection: false
})

export const CONNECT_DB = async () => {
  // Establish connection to MongoDB Atlas using the configured client instance
  // Retry logic for connection failures
  let retries = 5
  while (retries > 0) {
    try {
      await mongoClientInstance.connect()
      // Optional: ping admin to validate successful connection
      try {
        await mongoClientInstance.db('admin').command({ ping: 1 })
        console.log('✅ Pinged MongoDB Atlas successfully')
      } catch (pingErr) {
        console.warn('⚠️ MongoDB ping warning (continuing):', pingErr?.message)
      }
      // Retrieve and cache the database instance after successful connection
      trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
      console.log('✅ Connected to database:', env.DATABASE_NAME)
      break
    } catch (error) {
      retries--
      console.error(`❌ Connection attempt failed. Retries left: ${retries}`)
      console.error('Error details:', error?.message)
      if (retries === 0) {
        console.error('❌ Failed to connect to MongoDB after all retries')
        throw error
      }
      console.log('⏳ Retrying in 3 seconds...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
}

// Export database instance for use throughout the application
// Note: This function should only be called after successful database connection
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Must connect to Database first!')
  return trelloDatabaseInstance
}

// Gracefully close database connection when needed
export const CLOSE_DB = async () => {
  console.log('4. Disconncting from MongoDB Cloud Atlas...')
  await mongoClientInstance.close()
  console.log('5. Disconnected from MongoDB Cloud Atlas')
}