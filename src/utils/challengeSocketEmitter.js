/**
 * Challenge Socket.IO Event Emitter
 * Centralized socket event emissions for challenge-related notifications
 */
/* eslint-disable no-console */

let io = null

/**
 * Initialize Socket.IO instance for backend
 * @param {SocketIOServer} socketIoInstance - The Socket.IO server instance from server.js
 */
export const initializeSocketIO = (socketIoInstance) => {
  io = socketIoInstance
}

/**
 * Emit new challenge created to all connected clients
 * @param {Object} challenge - The newly created challenge
 */
export const emitChallengeCreated = (challenge) => {
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized yet')
    return
  }

  const notification = {
    type: 'challenge_created',
    title: 'New Challenge Posted',
    message: `${challenge.creatorDisplayName} posted a new challenge: "${challenge.title}"`,
    challengeId: challenge._id,
    challengeTitle: challenge.title,
    creatorName: challenge.creatorDisplayName,
    creatorAvatar: challenge.creatorAvatar,
    image: challenge.image,
    difficulty: challenge.difficulty,
    duration: challenge.duration,
    timestamp: new Date().toISOString()
  }

  console.log('[Socket] Emitting CHALLENGE_CREATED:', {
    challengeId: challenge._id,
    title: challenge.title
  })

  io.emit('CHALLENGE_CREATED', {
    notification,
    challenge
  })
}

/**
 * Emit challenge participant joined notification to challenge creator
 * @param {Object} challenge - The challenge
 * @param {Object} participant - The new participant
 * @param {String} creatorId - The challenge creator's user ID
 */
export const emitChallengeParticipant = (challenge, participant, creatorId) => {
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized yet')
    return
  }

  const notification = {
    type: 'challenge_participant',
    title: 'New Participant',
    message: `${participant.userDisplayName} joined your challenge "${challenge.title}"!`,
    challengeId: challenge._id,
    challengeTitle: challenge.title,
    participantName: participant.userDisplayName,
    participantAvatar: participant.userAvatar,
    participantCount: challenge.participantCount,
    timestamp: new Date().toISOString()
  }

  console.log('[Socket] Emitting CHALLENGE_PARTICIPANT_JOINED:', {
    challengeId: challenge._id,
    participantName: participant.userDisplayName,
    creatorId
  })

  io.emit('CHALLENGE_PARTICIPANT_JOINED', {
    notification,
    challenge,
    creatorId
  })
}

/**
 * Emit challenge completed notification
 * @param {Object} challenge - The challenge
 * @param {String} participantName - The participant who completed
 */
export const emitChallengeCompleted = (challenge, participantName) => {
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized yet')
    return
  }

  const notification = {
    type: 'challenge_completed',
    title: 'Challenge Completed',
    message: `${participantName} completed the challenge "${challenge.title}"!`,
    challengeId: challenge._id,
    participantName,
    timestamp: new Date().toISOString()
  }

  console.log('[Socket] Emitting CHALLENGE_COMPLETED:', {
    challengeId: challenge._id,
    participant: participantName
  })

  io.emit('CHALLENGE_COMPLETED', {
    notification,
    challenge
  })
}

export const challengeSocketEmitter = {
  initializeSocketIO,
  emitChallengeCreated,
  emitChallengeParticipant,
  emitChallengeCompleted
}
