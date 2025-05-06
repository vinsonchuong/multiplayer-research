import {
  html,
  css,
  render as renderComponent,
  Component,
} from 'watchband/component'
import {Computed} from 'watchband/signal'
import {Ui as BaseUi} from '../../lib/ui/ui.js'
import {SignInForm} from '../../lib/users/index.js'
import {Home} from './home.js'

class View extends Component {
  static tagName = 'mr-view'
  static styles = css`
    :host {
      place-self: stretch;
      display: grid;
    }
  `
  user = this.ask('user')
  template = html`
    ${new Computed(() =>
      this.user.get() ? html`<${Home}><//>` : html`<${SignInForm}><//>`,
    )}
  `
}

export class Ui extends BaseUi {
  render() {
    renderComponent(View, this.window.document.body)
    this.connected.set(true)
  }
}
