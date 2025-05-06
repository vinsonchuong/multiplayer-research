import test from 'ava'
import {FakePeersBroker} from '../webrtc/fake-peers.js'
import {P2PSyncedCollection} from './p2p-synced-collection.js'

test('crud', (t) => {
  const broker = new FakePeersBroker()

  class TodoCrud extends P2PSyncedCollection {
    buildNew(yMap) {
      yMap.set('description', 'New Todo')
      yMap.set('done', false)
    }
  }

  const peers = broker.makeInstance()
  const todoRepo = new TodoCrud(peers)
  t.teardown(() => {
    todoRepo.teardown()
  })

  t.is(todoRepo.getAll().get().length, 0)

  todoRepo.create('1')

  t.is(todoRepo.getAll().get().length, 1)
  const todo = todoRepo.get('1')
  t.deepEqual(todo.get(), {id: '1', description: 'New Todo', done: false})

  todoRepo.update('1', [], 'set', ['description', 'Updated Todo'])

  t.deepEqual(todo.get(), {id: '1', description: 'Updated Todo', done: false})

  todoRepo.update('1', [], 'set', ['done', true])

  t.deepEqual(todo.get(), {id: '1', description: 'Updated Todo', done: true})
})

test('replicating creates and updates', (t) => {
  const broker = new FakePeersBroker()

  class TodoCrud extends P2PSyncedCollection {
    static namespace = 'todo'

    buildNew(yMap) {
      yMap.set('description', 'New Todo')
      yMap.set('done', false)
    }
  }

  const peers1 = broker.makeInstance()
  const todoRepo1 = new TodoCrud(peers1)
  t.teardown(() => {
    todoRepo1.teardown()
  })

  const peers2 = broker.makeInstance()
  const todoRepo2 = new TodoCrud(peers2)
  t.teardown(() => {
    todoRepo2.teardown()
  })

  todoRepo1.create('1')

  const todoFromRepo2 = todoRepo2.get('1')
  t.deepEqual(todoFromRepo2.get(), {
    id: '1',
    description: 'New Todo',
    done: false,
  })

  todoRepo1.update('1', [], 'set', ['description', 'Updated Todo'])

  t.deepEqual(todoFromRepo2.get(), {
    id: '1',
    description: 'Updated Todo',
    done: false,
  })
})

test('synchronizing on start up', (t) => {
  const broker = new FakePeersBroker()

  class TodoCrud extends P2PSyncedCollection {
    static namespace = 'todo'

    buildNew(yMap) {
      yMap.set('description', 'New Todo')
      yMap.set('done', false)
    }
  }

  const peers1 = broker.makeInstance()
  const todoRepo1 = new TodoCrud(peers1)
  t.teardown(() => {
    todoRepo1.teardown()
  })

  todoRepo1.create('1')
  todoRepo1.update('1', [], 'set', ['description', 'Todo One'])

  todoRepo1.create('2')
  todoRepo1.update('2', [], 'set', ['description', 'Todo Two'])
  todoRepo1.update('2', [], 'set', ['done', true])

  const peers2 = broker.makeInstance()
  const todoRepo2 = new TodoCrud(peers2)
  t.teardown(() => {
    todoRepo2.teardown()
  })
  todoRepo2.sync()

  t.deepEqual(todoRepo2.get('1').get(), {
    id: '1',
    description: 'Todo One',
    done: false,
  })

  t.deepEqual(todoRepo2.get('2').get(), {
    id: '2',
    description: 'Todo Two',
    done: true,
  })
})
