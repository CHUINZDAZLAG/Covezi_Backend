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
import { setupSwagger } from '~/config/swagger'
// Challenge cron jobs
import { challengeCronJobs } from './jobs/challengeJobs'
// Voucher cleanup cron job
import { scheduleVoucherCleanupJob } from './jobs/voucherCleanupJob'
// Challenge socket emitter
import { initializeSocketIO } from './utils/challengeSocketEmitter.js'

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

  // Health check endpoint (for Render)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Debug logging middleware - log all requests
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`)
    next()
  })

  // Mount API v1 routes
  app.use('/v1', APIs_V1)

  // Setup API Documentation with Swagger
  setupSwagger(app)

  // Apply centralized error handling middleware
  app.use(errorHandlingMiddleware)

  // Create HTTP server with Socket.io
  const httpServer = http.createServer(app)
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions
  })

  // Initialize socket emitter with IO instance
  initializeSocketIO(io)

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('📌 New socket connection:', socket.id)
    socket.on('disconnect', () => {
      console.log('📌 Socket disconnected:', socket.id)
    })
  })

  // 🐱 Chat namespace for ZiZi chatbot streaming
  const chatNamespace = io.of('/chat')
  chatNamespace.on('connection', (socket) => {
    console.log('🐱 [Chat] New connection:', socket.id)
    
    // Join session room when client provides sessionId
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId)
      console.log(`🐱 [Chat] Socket ${socket.id} joined session: ${sessionId}`)
    })
    
    // Leave session room
    socket.on('leave_session', (sessionId) => {
      socket.leave(sessionId)
      console.log(`🐱 [Chat] Socket ${socket.id} left session: ${sessionId}`)
    })
    
    socket.on('disconnect', () => {
      console.log('🐱 [Chat] Disconnected:', socket.id)
    })
  })
  
  // Store chat namespace in app for use in controllers
  app.set('chatIO', chatNamespace)

  // Schedule cron jobs
  challengeCronJobs.initChallengeJobs()
  scheduleVoucherCleanupJob()

  // Start server - bind to PORT environment variable (required for Render)
  const port = process.env.PORT || env.LOCAL_DEV_APP_PORT || 8017
  
  httpServer.listen(port, () => {
    console.log(`✅ Server running on port ${port}`)
  })
  
  httpServer.on('error', (err) => {
    console.error('❌ Server error:', err)
    process.exit(1)
  })

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
