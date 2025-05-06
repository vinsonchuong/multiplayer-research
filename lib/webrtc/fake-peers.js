export class FakePeersBroker {
  #instances = new Set()
  #instancesByPeerId = new Map()

  makeInstance() {
    const instance = new FakePeers(this)
    this.#instances.add(instance)
    this.#instancesByPeerId.set(instance.peerId, instance)
    return instance
  }

  publish(peerId, topic, data) {
    const instance = this.#instancesByPeerId.get(peerId)
    instance.dispatchEvent(
      new MessageEvent(topic, {
        data: {
          peerId,
          data,
        },
      }),
    )
  }

  broadcast(fromPeerId, topic, data) {
    for (const instance of this.#instances) {
      if (instance.peerId === fromPeerId) {
        continue
      }

      instance.dispatchEvent(
        new MessageEvent(topic, {
          data: {
            peerId: fromPeerId,
            data,
          },
        }),
      )
    }
  }
}

export class FakePeers extends EventTarget {
  peerId = crypto.randomUUID()

  #broker

  constructor(broker) {
    super()
    this.#broker = broker
  }

  publish(peerId, topic, data) {
    this.#broker.publish(peerId, topic, data)
  }

  broadcast(topic, data) {
    this.#broker.broadcast(this.peerId, topic, data)
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
