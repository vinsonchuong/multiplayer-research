import {Component, html, css} from 'watchband/component'
import {ComputedList} from '../../lib/signals/computed-list.js'
import {ListItemEditor} from './list-item-editor.js'

export class ListEditor extends Component {
  static tagName = 'mr-list-editor'
  static styles = css`
    :host {
      place-self: stretch;
      display: grid;
    }
  `
  list = this.ask('list')
  adds = this.event('add-list-item')
  template = html`
    <article>
      <button on:click="${this.adds}">Add</button>

      ${new ComputedList(
        this.list,
        (listItem) => html`<${ListItemEditor} list-item=${listItem} />`,
      )}
    </article>
  `
}
