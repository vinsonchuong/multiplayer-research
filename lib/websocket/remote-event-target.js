export class RemoteEventTarget extends EventTarget {
  #webSocket

  constructor(urlOrWebSocket) {
    super()

    this.#webSocket =
      typeof urlOrWebSocket === 'string'
        ? new WebSocket(urlOrWebSocket)
        : urlOrWebSocket

    this.#webSocket.addEventListener('message', (messageEvent) => {
      const payload = JSON.parse(messageEvent.data)
      super.dispatchEvent(new MessageEvent(payload.topic, {data: payload.data}))
    })
  }

  dispatchEvent(messageEvent) {
    this.#webSocket.send(
      JSON.stringify({
        topic: messageEvent.type,
        data: messageEvent.data,
      }),
    )
  }
}
