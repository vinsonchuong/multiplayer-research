import sortBy from 'lodash/sortBy.js'
import {State} from 'watchband/signal'

export class Users {
  #peers
  #ui

  #connectedPeers = new Set()

  #usersById = new Map()
  #users = new State([])

  #user = new State(null)

  constructor(peers, ui) {
    this.#peers = peers
    this.#ui = ui

    peers.subscribe({
      'peer:connect': ({peerId}) => {
        this.#connectedPeers.add(peerId)
      },

      'peer:identify': ({peerId, data: {name}}) => {
        if (this.#usersById.has(peerId)) {
          return
        }

        const user = {id: peerId, name}
        this.#usersById.set(peerId, user)
        this.#users.set(sortBy([...this.#users.get(), user], ['name']))
      },

      'peer:disconnect': ({peerId}) => {
        this.#connectedPeers.delete(peerId)
        this.#usersById.delete(peerId)
        this.#users.set(this.#users.get().filter((u) => u.id !== peerId))
      },
    })

    ui.subscribe({
      'context-request': (event) => {
        const {
          detail: {key, callback},
        } = event

        if (key === 'user') {
          event.stopImmediatePropagation()
          callback(this.#user)
        } else if (key === 'users') {
          event.stopImmediatePropagation()
          callback(this.#users)
        }
      },

      'sign-in': ({detail: {name}}) => {
        this.#user.set({id: this.#peers.peerId, name})
        this.#peers.broadcast('peer:identify', {name})

        setInterval(() => {
          this.#peers.broadcast('peer:identify', {name})
        }, 1000)
      },
    })
  }

  get(id) {
    return this.#usersById.get(id)
  }
}
