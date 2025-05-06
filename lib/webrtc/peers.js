import P2PCF from 'p2pcf'
import {fromString, toString} from 'uint8arrays'

export class Peers extends EventTarget {
  #p2pcf
  #peers = new Map()

  constructor(roomId) {
    super()

    this.#p2pcf = new P2PCF(crypto.randomUUID(), roomId, {
      workerUrl: 'https://multiplayer-research.vinsonchuong.workers.dev',
    })

    this.#p2pcf.on('peerconnect', (peer) => {
      this.#peers.set(peer.id, peer)

      this.dispatchEvent(
        new MessageEvent('peer:connect', {
          data: {
            peerId: peer.id,
          },
        }),
      )
    })

    this.#p2pcf.on('peerclose', (peer) => {
      this.#peers.delete(peer.id)

      this.dispatchEvent(
        new MessageEvent('peer:disconnect', {
          data: {
            peerId: peer.id,
          },
        }),
      )
    })

    this.#p2pcf.on('msg', (peer, data) => {
      const message = JSON.parse(toString(data))

      this.dispatchEvent(
        new MessageEvent(message.topic, {
          data: {
            peerId: peer.id,
            data: message.data,
          },
        }),
      )
    })

    this.#p2pcf.start()
  }

  get peerId() {
    return this.#p2pcf.sessionId
  }

  publish(peerId, topic, data) {
    const peer = this.#peers.get(peerId)
    this.#p2pcf.send(peer, fromString(JSON.stringify({topic, data})))
  }

  broadcast(topic, data) {
    this.#p2pcf.broadcast(fromString(JSON.stringify({topic, data})))
  }

  subscribe(...args) {
    if (typeof args[0] === 'string') {
      const [topic, callback] = args

      this.addEventListener(topic, (event) => {
        callback(event.data)
      })
    } else {
      const [callbacks] = args
      for (const topic of Object.keys(callbacks)) {
        this.addEventListener(topic, (event) => {
          callbacks[topic](event.data)
        })
      }
    }
  }
}
