/* eslint-disable no-console */

import express from 'express'
import AsyncExitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1/index'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import cors from 'cors'
import { corsOptions } from './config/cors'

const START_SERVER = () => {
  const app = express()

  // Handle CORS
  app.use(cors(corsOptions))

  // Enable req.body json data
  app.use(express.json())

  // Use APIs V1
  app.use('/v1', APIs_V1)

  // Middleware xu ly loi tap trung
  app.use(errorHandlingMiddleware)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`3. Hi ${env.AUTHOR}, Server is running at ${env.APP_HOST}:${env.APP_PORT}`)
  })

  // Ham nay hien tai tren Window khong hoat dong!
  // Co the dong hay khong dong ket noi cung duoc
  AsyncExitHook(() => {
    CLOSE_DB()
  })
}

// Chi khi ket noi toi Database thanh cong thi moi Start Server Backend
// Immediately-invoked / Anonymous Async Function (IIFE)
(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('2. Connected to MongoDB Cloud Atlas!')

    START_SERVER()
  } catch (err) {
    console.log(err)
    process.exit(0)
  }
})()
