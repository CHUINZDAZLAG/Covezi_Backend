// Param socket will be got from socket.io lib
export const inviteUserToBoardSocket = (socket) => {
  // Listen to event that Client emit/send having name FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    // Fastest and simple way is that emit back a an event to every client except user sending request
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}