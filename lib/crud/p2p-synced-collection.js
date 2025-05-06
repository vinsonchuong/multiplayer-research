import * as Y from 'yjs'
import {fromString, toString} from 'uint8arrays'
import {State} from 'watchband/signal'

export class P2PSyncedCollection {
  static namespace = 'crud'

  #peers

  #docs = new Map()
  #signals = new Map()
  #allSignals = new State([])

  #teardownCallbacks = []

  constructor(peers) {
    this.#peers = peers

    peers.subscribe({
      [`${this.constructor.namespace}:create`]: ({data: {id, update}}) => {
        this.#createDoc(id, (doc) => {
          Y.applyUpdate(doc, fromString(update, 'base64'))
        })
      },

      [`${this.constructor.namespace}:update`]: ({data: {id, update}}) => {
        const doc = this.#docs.get(id)
        Y.applyUpdate(doc, fromString(update, 'base64'))
      },

      [`${this.constructor.namespace}:sync-request`]: ({peerId}) => {
        this.#peers.publish(
          peerId,
          `${this.constructor.namespace}:sync-response`,
          Object.fromEntries(
            this.#docs
              .entries()
              .map(([id, doc]) => [
                id,
                toString(Y.encodeStateAsUpdate(doc), 'base64'),
              ]),
          ),
        )
      },

      [`${this.constructor.namespace}:sync-response`]: ({data: docUpdates}) => {
        for (const [id, update] of Object.entries(docUpdates)) {
          if (this.#docs.has(id)) {
            const doc = this.#docs.get(id)
            Y.applyUpdate(doc, fromString(update, 'base64'))
          } else {
            this.#createDoc(id, (doc) => {
              Y.applyUpdate(doc, fromString(update, 'base64'))
            })
          }
        }
      },
    })

    {
      const intervalId = setInterval(() => {
        this.sync()
      }, 5000)

      this.#teardownCallbacks.push(() => {
        clearInterval(intervalId)
      })
    }
  }

  teardown() {
    for (const callback of this.#teardownCallbacks) {
      callback()
    }
  }

  sync() {
    this.#peers.broadcast(`${this.constructor.namespace}:sync-request`)
  }

  #createDoc(id, setupDoc = () => {}) {
    const doc = new Y.Doc()
    this.#docs.set(id, doc)

    setupDoc(doc)

    const data = doc.getMap('data')

    const signal = new State({id, ...data.toJSON()})
    this.#signals.set(id, signal)
    this.#allSignals.set([...this.#allSignals.get(), signal])

    data.observeDeep(() => {
      signal.set({id, ...data.toJSON()})
    })

    doc.on('update', (update) => {
      this.#peers.broadcast(`${this.constructor.namespace}:update`, {
        id,
        update: toString(update, 'base64'),
      })
    })

    return doc
  }

  buildNew(yMap) {}

  create(id) {
    const doc = this.#createDoc(id, (doc) => {
      const data = doc.getMap('data')
      this.buildNew(data)
    })

    this.#peers.broadcast(`${this.constructor.namespace}:create`, {
      id,
      update: toString(Y.encodeStateAsUpdate(doc), 'base64'),
    })
  }

  update(id, path, op, parameters) {
    const doc = this.#docs.get(id)
    const data = doc.getMap('data')

    let target = data
    for (const pathItem of path) {
      target = target.get(pathItem)
    }

    target[op](...parameters)
  }

  get(id) {
    return this.#signals.get(id)
  }

  getAll() {
    return this.#allSignals
  }
}
