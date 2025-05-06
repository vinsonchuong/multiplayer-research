import {State} from 'watchband/signal'
import {IdentityMap} from './identity-map.js'

export class SignalIdentityMap extends IdentityMap {
  constructor(makeDefault = () => null) {
    super((id) => new State(makeDefault(id)))
  }

  set(id, value) {
    const signal = this.get(id)
    signal.set(value)
  }
}
