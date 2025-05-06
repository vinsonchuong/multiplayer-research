import {RemoteEventTarget} from './remote-event-target.js'

export class RemoteEvents extends RemoteEventTarget {
  publish(topic, data) {
    this.dispatchEvent(new MessageEvent(topic, {data}))
  }

  subscribe(...args) {
    if (typeof args[0] === 'string') {
      const [topic, callback] = args

      this.addEventListener(topic, (event) => {
        callback(event.data)
      })
    } else {
      const [callbacks] = args
      for (const topic of Object.keys(callbacks)) {
        this.addEventListener(topic, (event) => {
          callbacks[topic](event.data)
        })
      }
    }
  }
}
