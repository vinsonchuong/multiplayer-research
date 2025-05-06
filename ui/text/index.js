import {Peers} from '../../lib/webrtc/peers.js'
import {Users} from '../../lib/users/index.js'
import {Document} from './document/index.js'
import {Ui} from './view.js'

const appId = '80a728be-0bf2-4f9b-9155-b4963f193d7a'
const peers = new Peers(appId)

const ui = new Ui(window)
const users = new Users(peers, ui)
const document = new Document(peers, users, ui)

ui.render()
