const test = require('tape')
const fs = require('fs')
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

test('persist database across instances', (t) => {
  const a = CreateTestSbot({ name: 'persistent' })

  a.publish({ type: 'test' }, (err, val) => {
    t.error(err, 'no error on publish')
    a.close((err) => {
      t.error(err, 'no error on close')
      const b = CreateTestSbot({
        name: 'persistent',
        startUnclean: true,
        keys: a.keys
      })
      b.get(val.key, (err, val) => {
        t.error(err, 'no error on get')
        t.ok(val, 'got message')
        b.close(t.end)
      })
    })
  })
})

test('allows specifying the path to the db', (t) => {
  const a = CreateTestSbot({ path: '/tmp/overhere/scuttle-testbot' })

  a.publish({ type: 'test' }, (err, val) => {
    t.error(err, 'no error on publish')
    a.close((err) => {
      t.error(err, 'no error on close')
      t.true(fs.existsSync('/tmp/overhere/scuttle-testbot/conn.json'))
      t.end()
    })
  })
})

test('can use db2', function (t) {
  const sbot = CreateTestSbot({ db2: true })
  t.ok(sbot.db)
  sbot.close(t.end)
})
