import initials from 'initials'
import uniqolor from 'uniqolor'
import {Component, html, css} from 'watchband/component'
import {State, Computed} from 'watchband/signal'

export class UserAvatar extends Component {
  static tagName = 'mr-user-avatar'
  static attributes = ['user']
  static styles = css`
    :host {
      display: inline-block;
    }

    figure {
      display: inline-block;
      border-radius: 50%;
      margin: 0;
      width: 32px;
      height: 32px;
      line-height: 32px;
      font-size: 14px;
      font-weight: 700;
      vertical-align: middle;
      text-align: center;
    }
  `
  user = new State(null)
  template = html`
    ${new Computed(() => {
      const user = this.user.get()
      if (!user) {
        return null
      }

      const figureColor = uniqolor(user.id)
      const backgroundColor = figureColor.color
      const color = figureColor.isLight ? '#000' : '#fff'

      return html`
        <figure
          style=${`background-color: ${backgroundColor}; color: ${color}`}
        >
          ${initials(user.name)}
        </figure>
      `
    })}
  `
}
