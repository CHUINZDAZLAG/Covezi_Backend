/* eslint-disable no-console */

import express from 'express'
import AsyncExitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1/index'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import cors from 'cors'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
// Config socket real-time with socket.io package
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SERVER = () => {
  const app = express()

  // Fix cái vụ Cache from disk của ExpressJS
  // https://stackoverflow.com/a/53240717/8324172
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Config Cookie Parser
  app.use(cookieParser())

  // Handle CORS
  app.use(cors(corsOptions))

  // Enable req.body json data
  app.use(express.json())

  // Use APIs V1
  app.use('/v1', APIs_V1)

  // Middleware xu ly loi tap trung
  app.use(errorHandlingMiddleware)

  // Create a new server covering app of express to do real-time with socket.io
  const server = http.createServer(app)
  // Initialize io variable with server and cors
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (socket) => {
    // Call sockets based on features
    inviteUserToBoardSocket(socket)
  })

  // Production environment (Render.com)
  if (env.BUILD_MODE === 'production') {
    // Use sever.listin instead of app.listin because server include express app and config of socket.io
    server.listen(process.env.PORT, () => {
      console.log(`3. Production: Hi ${env.AUTHOR}, Server is running at ${process.env.PORT}`)
    })
  } else {
    // Local environment
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(`3. Local dev: Hi ${env.AUTHOR}, Server is running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}`)
    })
  }

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
