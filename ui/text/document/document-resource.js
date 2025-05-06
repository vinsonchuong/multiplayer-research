import {State} from 'watchband/signal'
import {P2PSyncedResource} from '../../../lib/crud/p2p-synced-resource.js'

export class DocumentResource extends P2PSyncedResource {
  static namespace = 'document'

  // { text: 'Hello World!' }
  static seedDoc = 'AQLd6oPXDQAnAQRkYXRhBHRleHQCBADd6oPXDQAMSGVsbG8gV29ybGQhAA'

  #ui

  constructor(peers, ui) {
    super(peers)
    this.#ui = ui

    ui.subscribe({
      'document:update': (event) => {
        const [path, op, parameters] = event.detail
        this.update(path, op, parameters)
      },

      'context-request': (event) => {
        const {
          detail: {key, callback},
        } = event

        if (key === 'document') {
          event.stopImmediatePropagation()
          callback(this.get())
        } else if (key === 'document:updates') {
          event.stopImmediatePropagation()
          callback(new State(this.subscribe()))
        }
      },
    })
  }
}
