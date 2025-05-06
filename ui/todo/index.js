import {Peers} from '../../lib/webrtc/peers.js'
import {Users} from '../../lib/users/index.js'
import {ItemCrud} from './item-crud.js'
import {Presence} from './presence.js'
import {Ui} from './view.js'

const appId = 'c471b8af-0659-4511-89d9-f8686611e5d2'
const peers = new Peers(appId)

const ui = new Ui(window)
const itemCrud = new ItemCrud(peers, ui)
const users = new Users(peers, ui)
const presence = new Presence(peers, users, ui)

ui.render()
