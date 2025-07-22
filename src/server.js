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
// Configure Socket.io for real-time communication
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SERVER = () => {
  const app = express()

  // Disable Express.js cache to prevent serving stale content
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Configure cookie parser middleware
  app.use(cookieParser())

  // Configure CORS middleware
  app.use(cors(corsOptions))

  // Enable JSON request body parsing
  app.use(express.json())

  // Mount API v1 routes
  app.use('/v1', APIs_V1)

  // Apply centralized error handling middleware
  app.use(errorHandlingMiddleware)

  // Create HTTP server wrapping Express app for Socket.io integration
  const server = http.createServer(app)
  // Initialize Socket.io with CORS configuration
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (socket) => {
    // Register socket handlers for specific features
    inviteUserToBoardSocket(socket)
  })

  // Production environment configuration (Render.com)
  if (env.BUILD_MODE === 'production') {
    // Use server.listen instead of app.listen to include Socket.io configuration
    server.listen(process.env.PORT, () => {
      console.log(`3. Production: Hi ${env.AUTHOR}, Server is running at ${process.env.PORT}`)
    })
  } else {
    // Local development environment
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(`3. Local dev: Hi ${env.AUTHOR}, Server is running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}`)
    })
  }

  // Graceful shutdown handler for database connections
  AsyncExitHook(() => {
    CLOSE_DB()
  })
}

// Initialize server only after successful database connection
// Immediately Invoked Function Expression (IIFE)
(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('2. Connected to MongoDB Cloud Atlas!')

    START_SERVER()
  } catch (error) {
    console.log(error)
    process.exit(0)
  }
})()
