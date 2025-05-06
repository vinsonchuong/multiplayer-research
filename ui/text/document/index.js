import {DocumentResource} from './document-resource.js'
import {DocumentPresence} from './document-presence.js'

export class Document {
  #peers
  #users
  #ui
  #documentResource
  #documentPresence

  constructor(peers, users, ui) {
    this.#peers = peers
    this.#users = users
    this.#ui = ui
    this.#documentResource = new DocumentResource(peers, ui)
    this.#documentPresence = new DocumentPresence(peers, users, ui)
  }
}
