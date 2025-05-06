import {map, tap} from 'rxjs'
import {Component, html, css} from 'watchband/component'
import {State, Computed} from 'watchband/signal'
import {ComputedList} from '../../lib/signals/computed-list.js'
import {UserAvatar} from '../../lib/users/index.js'
import {Input} from '../../lib/components/input.js'

export class ListItemEditor extends Component {
  static tagName = 'mr-list-item-editor'
  static attributes = ['list-item']
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    aside {
      position: absolute;
      top: 0;
      right: 100%;
      width: max-content;
    }
  `
  listItem = new State({content: ''})
  users = this.ask(
    new Computed(() => ['users-viewing', this.listItem.get().id]),
  )

  updates = this.event()
  focuses = this.event()
  listItemUpddates = this.event(
    'update-list-item',
    this.updates.pipe(
      map((event) => ({id: this.listItem.get().id, content: event.detail})),
    ),
  )

  views = this.event(
    'view',
    this.focuses.pipe(map(() => this.listItem.get().id)),
  )

  template = html`
    <div>
      <${Input}
        initial-value=${new Computed(() => this.listItem.get().content)}
        on:update=${this.updates}
        on:focus=${this.focuses}
      />

      <aside>
        ${new ComputedList(
          this.users,
          (user) => html`<${UserAvatar} user=${user} />`,
        )}
      </aside>
    </div>
  `
}
