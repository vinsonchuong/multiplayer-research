import baseServeWebSocket from 'passing-notes-websocket'

export function serveWebSocket({logger}, handleConnection) {
  return baseServeWebSocket((ws) => {
    logger.log({
      level: 'INFO',
      topic: 'WebSocket',
      message: 'Connection established',
    })

    let active = true
    ws.on('pong', () => {
      active = true
    })
    function pingPong() {
      setTimeout(() => {
        if (active) {
          active = false
          ws.ping()
          pingPong()
        } else {
          logger.log({
            level: 'ERROR',
            topic: 'WebSocket',
            message: 'Idle connection terminated',
          })
          ws.terminate()
        }
      }, 1000)
    }

    pingPong()

    ws.on('error', (error) => {
      logger.log({
        level: 'ERROR',
        topic: 'websocket',
        message: error.message,
      })
    })

    handleConnection(ws)
  })
}
