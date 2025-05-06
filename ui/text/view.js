import isEqual from 'lodash/isEqual.js'
import {Signal} from 'signal-polyfill'
import {Subject, fromEvent, filter, map, mergeMap, tap, of} from 'rxjs'
import {html} from 'watchband/html'
import {State, Computed, effect} from 'watchband/signal'
import {registerComponent} from 'watchband/component'
import uniqolor from 'uniqolor'
import slugify from '@sindresorhus/slugify'
import {Ui as BaseUi} from '../../lib/ui/ui.js'
import {SignInForm, UsersList} from '../../lib/users/index.js'

registerComponent(SignInForm)
registerComponent(UsersList)

function render({user, document, updates, presence}) {
  const {element} = html`
    ${new Computed(() =>
      user.get()
        ? renderEditor({document, updates, presence})
        : html`<mr-sign-in-form><//>`,
    )}
  `

  return element
}

function renderEditor({document, updates, presence}) {
  const initialText = new State('')

  effect(() => {
    const currentDocument = document.get()
    if (!Signal.subtle.untrack(() => initialText.get()) && currentDocument) {
      initialText.set(currentDocument.text)
    }
  })

  effect(() => {
    const observable = updates.get()
    if (observable) {
      observable.subscribe((event) => {
        if (event.fromLocal || !isEqual(event.path, ['text'])) {
          return
        }

        const editor = window.editor

        editor.normalize()
        if (!editor.hasChildNodes()) {
          editor.append(document.createTextNode(''))
        }

        const textNode = editor.childNodes[0]

        for (const update of event.updates) {
          const op = update[0]

          if (op === 'insert') {
            const [, offset, text] = update
            textNode.insertData(offset, text)
          } else if (op === 'delete') {
            const [, offset, count] = update
            textNode.deleteData(offset, count)
          }
        }
      })
    }
  })

  const highlightStyles = new window.CSSStyleSheet()
  window.document.adoptedStyleSheets.push(highlightStyles)

  const userHighlights = new Map()
  const userCarets = new Map()
  effect(() => {
    const userSelections = presence.get()

    const editor = window.editor
    if (!editor) {
      return
    }

    editor.normalize()
    const textNode = editor.childNodes[0]

    for (const {
      user,
      parameters: [{start, end}],
    } of userSelections) {
      if (!userHighlights.has(user)) {
        const userIdSlug = slugify(user.id)

        const highlight = new window.Highlight()
        window.CSS.highlights.set(`user-${userIdSlug}`, highlight)
        userHighlights.set(user, highlight)

        const {color: backgroundColor, isLight} = uniqolor(user.id)
        const color = isLight ? '#000' : '#fff'
        highlightStyles.insertRule(`
          ::highlight(user-${userIdSlug}) {
            background-color: ${backgroundColor};
            color: ${color};
          }
        `)
      }

      const highlight = userHighlights.get(user)
      highlight.clear()

      const range = new window.Range()
      range.setStart(textNode, start)
      range.setEnd(textNode, end)
      highlight.add(range)

      if (!userCarets.has(user)) {
        const caret = window.document.createElement('div')
        const {color} = uniqolor(user.id)
        caret.style.setProperty('color', color)
        window.carets.append(caret)
        userCarets.set(user, caret)
      }

      const caret = userCarets.get(user)
      if (range.collapsed) {
        caret.classList.add('show')
        const {top, left} = range.getBoundingClientRect()
        caret.style.setProperty('top', `${top}px`)
        caret.style.setProperty('left', `${left}px`)
      } else {
        caret.classList.remove('show')
      }
    }
  })

  return html`
    <style>
      main {
        place-self: stretch;
        display: grid;
        grid-template-columns: 1fr 1.618fr;

        & > article {
          grid-column: 2;
        }

        & > mr-users-list {
          grid-column: 1;
          place-self: end stretch;
        }

        #carets {
          position: absolute;

          & > * {
            position: absolute;
            width: 2px;
            height: 18px;
            background: currentColor;
          }
        }
      }
    </style>

    <main>
      <mr-users-list><//>
      <article id="editor" contenteditable="plaintext-only">
        ${initialText}
      </article>
      <div id="carets"></div>
    </main>
  `
}

function getSelection(element) {
  const selection = window.getSelection()

  if (!selection.anchorNode) {
    return null
  }

  const anchorOffset = getAbsoluteTextOffset(
    element,
    selection.anchorNode,
    selection.anchorOffset,
  )

  const focusOffset = getAbsoluteTextOffset(
    element,
    selection.focusNode,
    selection.focusOffset,
  )

  return anchorOffset < focusOffset
    ? {start: anchorOffset, end: focusOffset}
    : {start: focusOffset, end: anchorOffset}
}

function getAbsoluteTextOffset(element, selectedNode, offset) {
  // SelectedNode is a <br>
  if (element === selectedNode) {
    let currentOffset = 0
    let absoluteTextIndex = 0
    for (const node of element.childNodes) {
      if (currentOffset === offset) {
        return absoluteTextIndex
      }

      if (node instanceof window.Text) {
        absoluteTextIndex += node.length
        currentOffset += 1
      } else if (node instanceof HTMLBRElement) {
        absoluteTextIndex += 1
        currentOffset += 1
      } else {
        console.error(element, selectedNode, offset)
        throw new Error('Unexpected element')
      }
    }
  } else {
    let absoluteTextIndex = 0

    for (const currentTextNode of element.childNodes) {
      if (currentTextNode === selectedNode) {
        return absoluteTextIndex + offset
      }

      absoluteTextIndex += currentTextNode.length ?? 1
    }
  }

  return null
}

function setSelection(element, start, end) {
  const {node: anchorNode, offset: anchorOffset} = getRelativeTextOffset(
    element,
    start,
  )
  const {node: focusNode, offset: focusOffset} = getRelativeTextOffset(
    element,
    end,
  )

  window
    .getSelection()
    .setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset)
}

function getRelativeTextOffset(element, absoluteOffset) {
  let absoluteIndex = 0

  for (const currentTextNode of element.childNodes) {
    if (absoluteIndex + currentTextNode.length >= absoluteOffset) {
      return {
        node: currentTextNode,
        offset: absoluteOffset - absoluteIndex,
      }
    }

    absoluteIndex += currentTextNode.length
  }
}

const supportedInputTypes = new Set([
  'insertText',
  'insertLineBreak',
  'deleteContentBackward',
])

export class Ui extends BaseUi {
  user = this.ask('user')

  document = this.ask('document')
  documentUpdates = this.ask('document:updates')
  documentPresence = this.ask(['document:presence', ['text']])

  beforeInputs = new Subject().pipe(
    tap((event) => {
      if (!supportedInputTypes.has(event.inputType)) {
        event.preventDefault()
      }
    }),
  )

  inputs = new Subject()
  selectionchanges = new Subject()

  updates = this.inputs.pipe(
    filter((event) => event.target.id === 'editor'),
    mergeMap((event) => {
      const {start, end} = this.selection
      if (event.inputType === 'insertText') {
        if (start < end) {
          return of(
            ['delete', start, end - start],
            ['insert', start, event.data],
          )
        }

        return of(['insert', start, event.data])
      }

      if (event.inputType === 'insertLineBreak') {
        if (start < end) {
          return of(['delete', start, end - start], ['insert', start, '\n'])
        }

        return of(['insert', start, '\n'])
      }

      if (event.inputType === 'deleteContentBackward') {
        if (start < end) {
          return of(['delete', start, end - start])
        }

        return of(['delete', start - 1, 1])
      }

      return null
    }),
  )

  selectionUpdates = this.selectionchanges.pipe(
    filter(() => this.window.document.activeElement?.id === 'editor'),
    map(() => getSelection(this.window.document.activeElement)),
    tap((selection) => {
      this.selection = selection
    }),
  )

  render() {
    const document = this.window.document
    const body = document.body

    body.append(
      render({
        user: this.user,
        document: this.document,
        updates: this.documentUpdates,
        presence: this.documentPresence,
      }),
    )

    fromEvent(document, 'selectionchange').subscribe(this.selectionchanges)
    fromEvent(body, 'beforeinput').subscribe(this.beforeInputs)
    fromEvent(body, 'input').subscribe(this.inputs)

    this.updates.subscribe((update) => {
      this.dispatchEvent(
        new CustomEvent('document:update', {
          detail: [['text'], update[0], update.slice(1)],
        }),
      )
    })
    this.selectionUpdates.subscribe((selection) => {
      this.dispatchEvent(
        new CustomEvent('document:select', {
          detail: [['text'], selection],
        }),
      )
    })

    this.connected.set(true)
  }
}
