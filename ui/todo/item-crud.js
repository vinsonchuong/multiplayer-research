import {P2PSyncedCollection} from '../../lib/crud/p2p-synced-collection.js'

export class ItemCrud extends P2PSyncedCollection {
  static namespace = 'todo'

  #ui

  constructor(peers, ui) {
    super(peers)
    this.ui = ui

    ui.subscribe({
      'context-request': (event) => {
        const {
          detail: {key, callback},
        } = event

        if (key === 'list') {
          event.stopImmediatePropagation()
          callback(this.getAll())
        }
      },

      'add-list-item': () => {
        this.create(crypto.randomUUID())
      },

      'update-list-item': ({detail: {id, content}}) => {
        this.update(id, [], 'set', ['content', content])
      },
    })
  }

  buildNew(yMap) {
    yMap.set('content', 'New Item')
  }
}
