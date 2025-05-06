import {Component, html, css} from 'watchband/component'
import {UsersList} from '../../lib/users/index.js'
import {ListEditor} from './list-editor.js'

export class Home extends Component {
  static tagName = 'mr-home'
  static styles = css`
    :host {
      place-self: stretch;
      display: grid;
    }

    main {
      place-self: stretch;
      display: grid;
      grid-template-columns: 1fr 1.618fr;

      & > mr-list-editor {
        grid-column: 2;
      }

      & > mr-users-list {
        grid-column: 1;
        place-self: end stretch;
      }
    }
  `
  template = html`
    <main>
      <${UsersList}><//>
      <${ListEditor}><//>
    </main>
  `
}
