import * as Y from 'yjs'
import {fromString, toString} from 'uint8arrays'
import {State} from 'watchband/signal'
import {Subject} from 'rxjs'
import get from 'lodash/get.js'

export class P2PSyncedResource {
  static namespace = 'resource'

  // { data: {} }
  static seedDoc = 'AAA'

  #peers

  #doc = new Y.Doc()
  #signal = new State()
  #observable = new Subject()

  #teardownCallbacks = []

  #localUpdate = false

  constructor(peers) {
    this.#peers = peers

    peers.subscribe({
      [`${this.constructor.namespace}:update`]: ({data: {update}}) => {
        Y.applyUpdate(this.#doc, fromString(update, 'base64'))
      },

      [`${this.constructor.namespace}:sync-request`]: ({peerId}) => {
        this.#peers.publish(
          peerId,
          `${this.constructor.namespace}:sync-response`,
          toString(Y.encodeStateAsUpdate(this.#doc), 'base64'),
        )
      },

      [`${this.constructor.namespace}:sync-response`]: ({data: update}) => {
        Y.applyUpdate(this.#doc, fromString(update, 'base64'))
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

    Y.applyUpdate(this.#doc, fromString(this.constructor.seedDoc, 'base64'))

    const data = this.#doc.getMap('data')

    this.#signal.set(data.toJSON())
    data.observeDeep((events) => {
      const oldValue = this.#signal.get()
      const newValue = data.toJSON()

      this.#signal.set(newValue)

      for (const event of events) {
        const {path} = event

        const parsedEvent = {
          path,
          updates: [],
          oldValue: get(oldValue, path),
          newValue: get(newValue, path),
          fromLocal: this.#localUpdate,
        }

        if (event instanceof Y.YTextEvent) {
          let index = 0

          for (const action of event.delta) {
            if (action.retain) {
              index += action.retain
            } else if (action.delete) {
              parsedEvent.updates.push(['delete', index, action.delete])
              index += action.delete
            } else if (action.insert) {
              parsedEvent.updates.push(['insert', index, action.insert])
            }
          }
        }

        this.#observable.next(parsedEvent)
      }
    })

    this.#doc.on('update', (update) => {
      this.#peers.broadcast(`${this.constructor.namespace}:update`, {
        update: toString(update, 'base64'),
      })
    })
  }

  teardown() {
    for (const callback of this.#teardownCallbacks) {
      callback()
    }
  }

  sync() {
    this.#peers.broadcast(`${this.constructor.namespace}:sync-request`)
  }

  update(path, op, parameters) {
    const data = this.#doc.getMap('data')

    let target = data
    for (const pathItem of path) {
      target = target.get(pathItem)
    }

    this.#localUpdate = true
    target[op](...parameters)
    this.#localUpdate = false
  }

  get() {
    return this.#signal
  }

  subscribe() {
    return this.#observable
  }

  get doc() {
    return this.#doc
  }
}
