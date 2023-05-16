const test = require('tape')
const fs = require('fs')
const { join } = require('path')
const CreateTestSbot = require('../')

test('creates an sbot', function (t) {
  const sbot = CreateTestSbot({ name: 'piet' })
  t.ok(sbot)
  sbot.close()
  t.end()
})

test('adds an sbot plugin and can be chained', function (t) {
  CreateTestSbot
    .use({ init: () => {}, name: 'fakePlugin1' })
    .use({ init: () => {}, name: 'fakePlugin2' })

  const sbot = CreateTestSbot()

  t.ok(sbot)
  sbot.close()
  t.end()
})

test('multi sbots that share some of the same plugins', function (t) {
  CreateTestSbot
    .use({ init: () => {}, name: 'fakePlugin1' })

  const sbot1 = CreateTestSbot()
  t.ok(sbot1)

  CreateTestSbot
    .use({ init: () => {}, name: 'fakePlugin1' })
    .use({ init: () => {}, name: 'fakePlugin2' })

  const sbot2 = CreateTestSbot()
  t.ok(sbot2)

  sbot1.close()
  sbot2.close()
  t.end()
})

function Testbot (opts) {
  if (!process.env.SSB_DB1) CreateTestSbot.use(require('ssb-db2/compat'))
  return CreateTestSbot(opts)
}

test('persist database across instances', (t) => {
  const a = Testbot({ name: 'persistent' })
  const content = { type: 'test' }

  a.publish(content, (err, val) => {
    t.error(err, 'publish message')
    const msgId = val && val.key
    a.close((err) => {
      t.error(err, 'restart (startUnclean: true)')
      const b = Testbot({
        name: 'persistent',
        keys: a.keys,
        startUnclean: true
      })
      b.get(msgId, (_, val) => {
        t.deepEqual(val.content, content, 'got message')
        b.close((err) => {
          t.error(err, 'restart (rimraf: false)')
          const c = Testbot({
            name: 'persistent',
            keys: a.keys,
            rimraf: false
          })
          c.get(msgId, (_, val) => {
            t.deepEqual(val.content, content, 'got message')
            c.close(t.end)
          })
        })
      })
    })
  })
})

test('allows specifying the path to the db', (t) => {
  const path = '/tmp/overhere/scuttle-testbot'
  const a = Testbot({ path })

  a.publish({ type: 'test' }, (err, val) => {
    t.error(err, 'no error on publish')
    a.close((err) => {
      t.error(err, 'no error on close')
      const expectedFolder = process.env.SSB_DB1 ? 'flume' : 'db2'
      const expectedPath = join(path, expectedFolder)
      t.true(fs.existsSync(expectedPath), 'can see server stored details at opts.path')
      t.end()
    })
  })
})
