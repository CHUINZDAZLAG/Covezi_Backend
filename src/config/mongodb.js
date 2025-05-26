/* eslint-disable no-console */

import { MongoClient } from 'mongodb'
import { env } from '~/config/environment'

let trelloDatabaseInstance = null

// Khởi tạo một đối tượng mongoClientInstance để connect tói MongoDB
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  // serverApi: {
  //   version: ServerApiVersion.v1,
  //   strict: true,
  //   deprecationErrors: true
  // }
})

export const CONNECT_DB = async () => {
  // Goi ket noi toi MongoDB Atlas voi URI da khai bao trong than cua mongoClientInstance
  await mongoClientInstance.connect()

  // Ket noi thanh cong thi lay ra Database theo ten va gan nguoc no lai vao bien trelloDatabaseInstance o tren
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

// Export ra trello database instance sau khi da connect thanh cong toi mongDB de su dung o nhieu noi
// Luu y phai dam bao chi luon goi getDB nay sau khi da ket noi thanh cong voi mongoDB
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Must connect to Database first!')
  return trelloDatabaseInstance
}

// Dong ket noi toi Database khi can
export const CLOSE_DB = async () => {
  console.log('4. Disconncting from MongoDB Cloud Atlas...')
  await mongoClientInstance.close()
  console.log('5. Disconnected from MongoDB Cloud Atlas')
}