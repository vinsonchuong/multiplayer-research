import {Computed} from 'watchband/signal'
import {SignalOneToManyMap} from '../../../lib/data-structures/signal-one-to-many-map.js'
import {IdentityMap} from '../../../lib/data-structures/identity-map.js'

export class DocumentPresence {
  #peers
  #users
  #ui

  #presenceByUserId = new Map()
  #userIdsToPaths = new SignalOneToManyMap()
  #pathUsers = new IdentityMap(
    (path) =>
      new Computed(() =>
        this.#userIdsToPaths
          .getByManyId(path)
          .get()
          .map((userId) => this.#presenceByUserId.get(userId)),
      ),
  )

  constructor(peers, users, ui) {
    this.#peers = peers
    this.#users = users
    this.#ui = ui

    peers.subscribe({
      'document:select': ({peerId, data: {path, parameters}}) => {
        const user = this.#users.get(peerId)
        if (user) {
          this.#presenceByUserId.set(peerId, {
            user,
            parameters,
          })
          this.#userIdsToPaths.set(peerId, path.join('.'))
        }
      },
    })

    ui.subscribe({
      'document:select': (event) => {
        const {
          detail: [path, ...parameters],
        } = event

        this.#peers.broadcast('document:select', {path, parameters})
      },

      'context-request': (event) => {
        const {
          detail: {key, callback},
        } = event

        if (key[0] === 'document:presence') {
          event.stopImmediatePropagation()
          const path = key[1]
          callback(this.#pathUsers.get(path.join('.')))
        }
      },
    })
  }
}
