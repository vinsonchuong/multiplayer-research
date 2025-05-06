import {Component, html, css} from 'watchband/component'
import {ComputedList} from '../signals/computed-list.js'
import {User} from './user.js'

export class UsersList extends Component {
  static tagName = 'mr-users-list'
  static styles = css`
    :host {
      place-self: stretch;
      display: grid;
    }

    ol {
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 18px;
    }
  `
  users = this.ask('users')
  user = this.ask('user')
  template = html`
    <aside>
      <ol>
        ${new ComputedList(
          this.users,
          (user) => html`
            <li>
              <${User} user=${user} />
            </li>
          `,
        )}
      </ol>

      <${User} user=${this.user} />
    </aside>
  `
}
