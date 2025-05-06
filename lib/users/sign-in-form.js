import {html, css, Component} from 'watchband/component'
import '@shoelace-style/shoelace/dist/components/card/card.js'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import {getFormControls} from '@shoelace-style/shoelace/dist/utilities/form.js'
import {Subject, tap, map} from 'rxjs'
import {Input} from '../components/input.js'

export class SignInForm extends Component {
  static tagName = 'mr-sign-in-form'
  static styles = css`
    :host {
      place-self: center;
    }

    [slot='header'] {
      font-size: var(--sl-font-size-large);
    }
  `
  submits = new Subject().pipe(
    tap((event) => {
      event.preventDefault()

      const form = event.target
      const formControls = getFormControls(form)
      const input = formControls.find(
        (input) => input.getAttribute('name') === 'name',
      )
      input.value = ''
    }),
  )

  signIns = this.event(
    'sign-in',
    this.submits.pipe(
      map((event) => Object.fromEntries(new FormData(event.target).entries())),
    ),
  )

  template = html`
    <form on:submit=${this.submits}>
      <sl-card>
        <div slot="header">Sign In</div>

        <${Input} name="name" label="Name" required><//>

        <div slot="footer">
          <sl-button variant="primary" type="submit">Submit</sl-button>
        </div>
      </sl-card>
    </form>
  `
}
