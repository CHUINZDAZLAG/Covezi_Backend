import { Router } from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { chatController } from '~/controllers/chatController'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import { createSessionSchema, updateSessionSchema, sendMessageSchema } from '~/validations/chatValidation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI Chat with ZiZi chatbot (Google Gemini + RAG)
 */

/**
 * @swagger
 * /v1/chat/sessions:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Eco Products Chat
 *                 default: New Chat
 *     responses:
 *       201:
 *         description: Chat session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChatSession'
 *   get:
 *     summary: Get all chat sessions for current user
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ChatSession'
 *                         total:
 *                           type: integer
 */
/**
 * @route POST /v1/chat/sessions
 * @desc Create a new chat session
 * @access Private
 */
router.post('/sessions', authMiddleware.isAuthorized, validationMiddleware(createSessionSchema), chatController.createSession)

/**
 * @route GET /v1/chat/sessions
 * @desc Get all chat sessions for current user
 * @access Private
 */
router.get('/sessions', authMiddleware.isAuthorized, chatController.getSessions)

/**
 * @swagger
 * /v1/chat/sessions/{sessionId}:
 *   get:
 *     summary: Get a specific chat session with messages
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/ChatSession'
 *                         - type: object
 *                           properties:
 *                             messages:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   role:
 *                                     type: string
 *                                     enum: [user, assistant]
 *                                   content:
 *                                     type: string
 *                                   createdAt:
 *                                     type: string
 *       404:
 *         description: Session not found
 *   put:
 *     summary: Update session title
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Chat Title
 *     responses:
 *       200:
 *         description: Session updated successfully
 *   delete:
 *     summary: Delete a chat session
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted successfully
 */
/**
 * @route GET /v1/chat/sessions/:sessionId
 * @desc Get a specific chat session with messages
 * @access Private
 */
router.get('/sessions/:sessionId', authMiddleware.isAuthorized, chatController.getSession)

/**
 * @swagger
 * /v1/chat/messages:
 *   post:
 *     summary: Send a message and get AI response via Socket.IO streaming
 *     description: Send a message to ZiZi AI chatbot. The response is streamed in real-time via Socket.IO on the /chat namespace. Connect to socket and join session room to receive streaming responses.
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Chat session ID
 *                 example: 507f1f77bcf86cd799439011
 *               message:
 *                 type: string
 *                 description: User message
 *                 example: What eco-friendly products do you recommend for kitchen?
 *     responses:
 *       200:
 *         description: Message sent successfully, AI response streaming via Socket.IO
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Message sent, response streaming...
 *                         sessionId:
 *                           type: string
 *                         userMessage:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             role:
 *                               type: string
 *                               example: user
 *                             content:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *       400:
 *         description: Validation error or session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @route POST /v1/chat/messages
 * @desc Send a message and get AI response via Socket.IO
 * @access Private
 */
router.post('/messages', authMiddleware.isAuthorized, validationMiddleware(sendMessageSchema), chatController.sendMessage)

/**
 * @swagger
 * /v1/chat/sessions/{sessionId}/messages:
 *   get:
 *     summary: Get messages in a session
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                                 enum: [user, assistant]
 *                               content:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                         total:
 *                           type: integer
 */
/**
 * @route GET /v1/chat/sessions/:sessionId/messages
 * @desc Get messages in a session
 * @access Private
 */
router.get('/sessions/:sessionId/messages', authMiddleware.isAuthorized, chatController.getMessages)

/**
 * @route PUT /v1/chat/sessions/:sessionId
 * @desc Update session title
 * @access Private
 */
router.put('/sessions/:sessionId', authMiddleware.isAuthorized, validationMiddleware(updateSessionSchema), chatController.updateSession)

/**
 * @route DELETE /v1/chat/sessions/:sessionId
 * @desc Delete a chat session
 * @access Private
 */
router.delete('/sessions/:sessionId', authMiddleware.isAuthorized, chatController.deleteSession)

/**
 * @swagger
 * /v1/chat/sessions/{sessionId}/generate-title:
 *   post:
 *     summary: Auto-generate session title based on conversation
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Title generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: Eco Kitchen Products Discussion
 */
/**
 * @route POST /v1/chat/sessions/:sessionId/generate-title
 * @desc Auto-generate session title
 * @access Private
 */
router.post('/sessions/:sessionId/generate-title', authMiddleware.isAuthorized, chatController.generateTitle)

/**
 * @swagger
 * /v1/chat/sessions/{sessionId}/clear:
 *   put:
 *     summary: Clear chat history (delete all messages in session)
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
/**
 * @route PUT /v1/chat/sessions/:sessionId/clear
 * @desc Clear chat history (soft delete all messages in session)
 * @access Private
 */
router.put('/sessions/:sessionId/clear', authMiddleware.isAuthorized, chatController.clearChat)

export const chatRoute = router
