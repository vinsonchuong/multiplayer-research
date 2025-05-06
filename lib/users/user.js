import {Component, html, css} from 'watchband/component'
import {State, Computed} from 'watchband/signal'
import {UserAvatar} from './user-avatar.js'

export class User extends Component {
  static tagName = 'mr-user'
  static attributes = ['user']
  static styles = css`
    :host {
      display: inline-block;
    }

    p {
      margin: 0;
      font-size: 20px;
    }

    mr-user-avatar {
      display: inline-block;
      margin: 0 8px 0 0;
    }
  `
  user = new State(null)
  template = html`
    ${new Computed(() => {
      const user = this.user.get()
      if (!user) {
        return null
      }

      return html`
        <p>
          <${UserAvatar} user=${this.user} />
          ${user.name}
        </p>
      `
    })}
  `
}
