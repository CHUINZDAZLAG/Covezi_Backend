/* eslint-disable no-console */
import { MongoClient } from 'mongodb'
import { env } from '~/config/environment'

let trelloDatabaseInstance = null

// Initialize MongoDB client instance for database connection
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  // serverApi: {
  //   version: ServerApiVersion.v1,
  //   strict: true,
  //   deprecationErrors: true
  // }
})

export const CONNECT_DB = async () => {
  // Establish connection to MongoDB Atlas using the configured client instance
  await mongoClientInstance.connect()

  // Retrieve and cache the database instance after successful connection
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
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