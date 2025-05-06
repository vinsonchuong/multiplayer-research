import {compose, Logger} from 'passing-notes'
import serveUi from 'passing-notes-ui'
import {serveRpc} from 'passing-notes-rpc'
import {RemoteEvents} from '../lib/websocket/remote-events.js'
import {serveWebSocket} from './serve-web-socket.js'

export const logger = new Logger()

export default compose(
  serveWebSocket({logger}, (ws) => {
    const events = new RemoteEvents(ws)
    events.subscribe({
      signIn() {
        console.log('foo')
      },
    })
  }),
  serveRpc({
    logger,
    actions: {},
  }),
  serveUi({path: './ui', logger}),
  () => () => ({status: 404}),
)
