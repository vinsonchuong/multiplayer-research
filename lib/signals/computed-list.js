import {Computed} from 'watchband/signal'

export class ComputedList extends Computed {
  #cache = new WeakMap()

  constructor(listSignal, transformItem) {
    super(() => {
      const list = listSignal.get() ?? []
      return list.map((item) => {
        if (this.#cache.has(item)) {
          return this.#cache.get(item)
        }

        const transformedItem = transformItem(item)
        this.#cache.set(item, transformedItem)
        return transformedItem
      })
    })
  }
}
