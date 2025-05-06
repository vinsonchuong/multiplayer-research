export class IdentityMap {
  #map = new Map()
  #makeDefault

  constructor(makeDefault = () => null) {
    this.#makeDefault = makeDefault
  }

  get(id) {
    if (this.#map.has(id)) {
      return this.#map.get(id)
    }

    const value = this.#makeDefault(id)
    this.#map.set(id, value)
    return value
  }

  set(id, value) {
    this.#map.set(id, value)
  }
}
