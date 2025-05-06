import {map, merge, tap} from 'rxjs'
import {Component, html, css} from 'watchband/component'
import {State, fromObservable} from 'watchband/signal'
import {fromSignal} from 'watchband/observable'
import '@shoelace-style/shoelace/dist/components/input/input.js'

export class Input extends Component {
  static tagName = 'mr-input'
  static attributes = ['name', 'label', 'required', 'initial-value']
  static formControl = true
  static styles = css`
    :host {
      display: block;
    }
  `
  name = new State('')
  label = new State('')
  required = new State(false)
  initialValue = new State('')
  inputs = this.event()
  inputValue = fromObservable(
    merge(
      fromSignal(this.initialValue),
      this.inputs.pipe(map((event) => event.target.value)),
    ).pipe(
      tap((value) => {
        this.element.internals.setFormValue(value)
      }),
    ),
  )

  updates = this.event(
    'update',
    this.inputs.pipe(map((event) => event.target.value)),
  )

  template = html`
    <sl-input
      name=${this.name}
      label=${this.label}
      required=${this.required}
      prop:value=${this.inputValue}
      on:sl-input=${this.inputs}
    />
  `
}
