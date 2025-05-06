import test from 'ava'
import * as Y from 'yjs'
import {toString} from 'uint8arrays'
import {FakePeersBroker} from '../webrtc/fake-peers.js'
import {P2PSyncedResource} from './p2p-synced-resource.js'

const seedDoc = 'AQLd6oPXDQAnAQRkYXRhBHRleHQCBADd6oPXDQAMSGVsbG8gV29ybGQhAA'
test('generating a seed doc', (t) => {
  const doc = new Y.Doc()
  const data = doc.getMap('data')
  const text = new Y.Text()
  text.insert(0, 'Hello World!')
  data.set('text', text)
  t.log(toString(Y.encodeStateAsUpdate(doc), 'base64'))
  t.pass()
})

test('yjs', (t) => {
  const doc1 = new Y.Doc()
  doc1.on('update', (update) => {
    Y.applyUpdate(doc2, update)
  })

  const doc2 = new Y.Doc()
  doc2.on('update', (update) => {
    Y.applyUpdate(doc1, update)
  })

  const doc1Text = doc1.get('text', Y.Text)
  doc1Text.insert(0, 'Hello World!')
  // Selection: llo
  const doc1FromPos = Y.createRelativePositionFromTypeIndex(doc1Text, 2)
  const doc1ToPos = Y.createRelativePositionFromTypeIndex(doc1Text, 5)

  console.log(
    Y.createAbsolutePositionFromRelativePosition(doc1FromPos, doc1).index,
    Y.createAbsolutePositionFromRelativePosition(doc1ToPos, doc1).index,
  )

  // Helhilo World!
  doc1Text.insert(3, 'hi')
  console.log(
    Y.createAbsolutePositionFromRelativePosition(doc1FromPos, doc1).index,
    Y.createAbsolutePositionFromRelativePosition(doc1ToPos, doc1).index,
  )

  console.log(
    Y.createAbsolutePositionFromRelativePosition(doc1FromPos, doc2).index,
    Y.createAbsolutePositionFromRelativePosition(doc1ToPos, doc2).index,
  )

  // Console.log(doc2.get('text', Y.Text).toJSON())
  // console.log(Y.createAbsolutePositionFromRelativePosition(doc1RelPos, doc2))
})

test('crud', (t) => {
  const broker = new FakePeersBroker()

  class ItemSyncedResource extends P2PSyncedResource {
    static namespace = 'item'
    static seedDoc = seedDoc
  }

  const peers = broker.makeInstance()
  const itemResource = new ItemSyncedResource(peers)
  t.teardown(() => {
    itemResource.teardown()
  })

  const item = itemResource.get()
  t.deepEqual(item.get(), {text: 'Hello World!'})

  itemResource.update(['text'], 'delete', [0, 6])

  t.deepEqual(item.get(), {text: 'World!'})

  itemResource.update(['text'], 'insert', [0, 'New '])

  t.deepEqual(item.get(), {text: 'New World!'})
})

test('replicating updates', (t) => {
  const broker = new FakePeersBroker()

  class ItemSyncedResource extends P2PSyncedResource {
    static namespace = 'item'
    static seedDoc = seedDoc
  }

  const peers1 = broker.makeInstance()
  const resource1 = new ItemSyncedResource(peers1)
  t.teardown(() => {
    resource1.teardown()
  })

  const peers2 = broker.makeInstance()
  const resource2 = new ItemSyncedResource(peers2)
  t.teardown(() => {
    resource2.teardown()
  })

  const data2 = resource2.get()
  t.deepEqual(data2.get(), {
    text: 'Hello World!',
  })

  resource1.update(['text'], 'delete', [0, 6])

  t.deepEqual(data2.get(), {
    text: 'World!',
  })

  resource1.update(['text'], 'insert', [0, 'New '])

  t.deepEqual(data2.get(), {
    text: 'New World!',
  })
})

test('synchronizing on start up', (t) => {
  const broker = new FakePeersBroker()

  class ItemSyncedResource extends P2PSyncedResource {
    static namespace = 'item'
    static seedDoc = seedDoc
  }

  const peers1 = broker.makeInstance()
  const resource1 = new ItemSyncedResource(peers1)
  t.teardown(() => {
    resource1.teardown()
  })

  resource1.update(['text'], 'delete', [0, 6])
  resource1.update(['text'], 'insert', [0, 'New '])

  const peers2 = broker.makeInstance()
  const resource2 = new ItemSyncedResource(peers2)
  t.teardown(() => {
    resource2.teardown()
  })
  resource2.sync()

  t.deepEqual(resource2.get().get(), {
    text: 'New World!',
  })
})
