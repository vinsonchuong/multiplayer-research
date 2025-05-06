import {Computed} from 'watchband/signal'
import {SignalOneToManyMap} from '../../lib/data-structures/signal-one-to-many-map.js'
import {IdentityMap} from '../../lib/data-structures/identity-map.js'

export class Presence {
  #peers
  #users
  #ui

  #userIdsToResourceIds = new SignalOneToManyMap()
  #resourceUsers = new IdentityMap(
    (resourceId) =>
      new Computed(() =>
        this.#userIdsToResourceIds
          .getByManyId(resourceId)
          .get()
          .map((userId) => this.#users.get(userId)),
      ),
  )

  #currentResourceId

  constructor(peers, users, ui) {
    this.#peers = peers
    this.#users = users
    this.#ui = ui

    peers.subscribe({
      'peer:view': ({peerId, data: {resourceId}}) => {
        this.#userIdsToResourceIds.set(peerId, resourceId)
      },
    })

    ui.subscribe({
      'context-request': (event) => {
        const {
          detail: {key, callback},
        } = event

        if (key[0] === 'users-viewing') {
          event.stopImmediatePropagation()
          const resourceId = key[1]
          callback(this.#resourceUsers.get(resourceId))
        }
      },

      view: ({detail: resourceId}) => {
        this.#currentResourceId = resourceId
        this.#peers.broadcast('peer:view', {resourceId})
      },
    })

    setInterval(() => {
      if (this.#currentResourceId) {
        this.#peers.broadcast('peer:view', {
          resourceId: this.#currentResourceId,
        })
      }
    }, 1000)
  }
}
