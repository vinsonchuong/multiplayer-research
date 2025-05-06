import {SignalIdentityMap} from './signal-identity-map.js'

export class SignalOneToManyMap {
  #byOne = new SignalIdentityMap(() => null)
  #byMany = new SignalIdentityMap(() => [])

  set(oneId, manyId) {
    const currentManyIdSignal = this.#byOne.get(oneId)
    const currentManyId = currentManyIdSignal.get()

    if (currentManyId) {
      const oneIdsForCurrentManySignal = this.#byMany.get(currentManyId)
      oneIdsForCurrentManySignal.set(
        oneIdsForCurrentManySignal.get().filter((o) => o !== oneId),
      )

      const oneIdsForManySignal = this.#byMany.get(manyId)
      oneIdsForManySignal.set([...oneIdsForManySignal.get(), oneId])

      currentManyIdSignal.set(manyId)
    } else {
      const oneIdsForManySignal = this.#byMany.get(manyId)
      oneIdsForManySignal.set([...oneIdsForManySignal.get(), oneId])

      currentManyIdSignal.set(manyId)
    }
  }

  unset(oneId) {
    const currentManyIdSignal = this.#byOne.get(oneId)
    const currentManyId = currentManyIdSignal.get()

    if (currentManyId) {
      const oneIdsForCurrentManySignal = this.#byMany.get(currentManyId)
      oneIdsForCurrentManySignal.set(
        oneIdsForCurrentManySignal.get().filter((o) => o !== oneId),
      )
    }

    currentManyIdSignal.set(null)
  }

  getByOneId(oneId) {
    return this.#byOne.get(oneId)
  }

  getByManyId(manyId) {
    return this.#byMany.get(manyId)
  }
}
