/* eslint-disable no-console */
import express from 'express'
import AsyncExitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB } from '~/config/mongodb'
import { CLOSE_DB as CLOSE_MONGOOSE, CONNECT_DB as CONNECT_MONGOOSE } from '~/config/mongooseConnection'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1/index'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import cors from 'cors'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
// Challenge cron jobs
import { challengeCronJobs } from './jobs/challengeJobs'
// Voucher cleanup cron job
import { scheduleVoucherCleanupJob } from './jobs/voucherCleanupJob'

const START_SERVER = () => {
  const app = express()

  // Disable Express.js cache to prevent serving stale content
  app.set('etag', false)
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
  
  // Enable URL-encoded form parsing (needed for FormData)
  app.use(express.urlencoded({ extended: true }))

  // Debug logging middleware - log all requests
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`)
    next()
  })

  // Mount API v1 routes
  app.use('/v1', APIs_V1)

  // Apply centralized error handling middleware
  app.use(errorHandlingMiddleware)

  // Create HTTP server with Socket.io
  const httpServer = http.createServer(app)
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions
  })

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('📌 New socket connection:', socket.id)
    socket.on('disconnect', () => {
      console.log('📌 Socket disconnected:', socket.id)
    })
  })

  // Schedule cron jobs
  challengeCronJobs.initChallengeJobs()
  scheduleVoucherCleanupJob()

  // Production environment configuration (Render.com)
  if (env.BUILD_MODE === 'production') {
    httpServer.listen(process.env.PORT, () => {
      console.log(`3. Production: Hi ${env.AUTHOR}, Server is running at ${process.env.PORT}`)
    })
  } else {
    // Local development environment
    httpServer.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(`3. Local dev: Hi ${env.AUTHOR}, Server is running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}`)
    })
  }

  // Handle uncaught exceptions
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    console.error(reason?.stack)
  })

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    console.error(error?.stack)
  })

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Received SIGINT, gracefully shutting down...')
    await CLOSE_DB()
    await CLOSE_MONGOOSE()
    process.exit(0)
  })
}

// Initialize server only after successful database connection
// Immediately Invoked Function Expression (IIFE)
(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    await CONNECT_MONGOOSE()
    console.log('2. Connected to MongoDB Cloud Atlas!')

    // Initialize cron jobs for challenge cleanup
    challengeCronJobs.initChallengeJobs()

    START_SERVER()
  } catch (error) {
    console.log(error)
    process.exit(0)
  }
})()
