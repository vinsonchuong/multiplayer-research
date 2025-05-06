import {State, Computed, effect, isSignal} from 'watchband/signal'

export class Ui {
  window
  connected = new State(false)

  constructor(window) {
    this.window = window
  }

  render() {
    this.connected.set(true)
  }

  addEventListener(topic, callback) {
    return this.window.document.body.addEventListener(topic, callback)
  }

  dispatchEvent(event) {
    return this.window.document.body.dispatchEvent(event)
  }

  subscribe(...args) {
    if (typeof args[0] === 'string') {
      const [topic, callback] = args

      this.addEventListener(topic, (event) => {
        callback(event)
      })
    } else {
      const [callbacks] = args
      for (const topic of Object.keys(callbacks)) {
        this.addEventListener(topic, (event) => {
          callbacks[topic](event)
        })
      }
    }
  }

  ask(key) {
    let upstreamSignal = null
    const ready = new State(false)
    const linkedSignal = new Computed(() =>
      ready.get() ? upstreamSignal.get() : null,
    )

    const cleanup = effect(() => {
      const resolvedKey = isSignal(key) ? key.get() : key
      if (Object.is(undefined, resolvedKey) || Object.is(null, resolvedKey)) {
        return
      }

      if (this.connected.get()) {
        cleanup()

        this.window.document.body.dispatchEvent(
          new this.window.CustomEvent('context-request', {
            detail: {
              key: resolvedKey,
              callback(signal) {
                upstreamSignal = signal
                ready.set(true)
              },
            },
            bubbles: true,
            composed: true,
          }),
        )
      }
    })

    return linkedSignal
  }
}
