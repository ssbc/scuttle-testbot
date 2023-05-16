const test = require('tape')
const pull = require('pull-stream')
const { promisify: p } = require('util')
const { replicate } = require('../')

const isDB2 = !process.env.SSB_DB1

let plugins = []
function TestBot (opts) {
  const stack = require('../')

  if (isDB2) {
    stack.use([
      // needed because tests use publish
      require('ssb-db2/compat/db'),
      require('ssb-db2/compat/publish'),
      // needed for replicate
      require('ssb-db2/compat/feedstate'),
      require('ssb-db2/compat/ebt'),
      require('ssb-db2/compat/log-stream'),
      require('ssb-db2/compat/history-stream')
    ])
  }

  stack
    .use(require('ssb-conn'))
    .use(require('ssb-friends'))
    .use(require('ssb-replicate')) // required by this version of friends

  plugins.forEach(plugin => stack.use(plugin))
  plugins = []

  return stack(opts)
}
TestBot.use = (plugin) => plugins.push(plugin) && TestBot

test('replicate', t => {
  const piet = TestBot({ name: 'piet' })
  const katie = TestBot({ name: 'katie' })

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }

  piet.publish(content, (err, msg) => {
    if (err) throw err

    replicate({ from: piet, to: katie }, (err) => {
      if (err) throw err

      katie.get({ id: msg.key, private: true }, (err, value) => {
        if (err) throw err

        t.deepEqual(value.content, content)
        // should be same as content piet sent, if katie can decrypt

        piet.close()
        katie.close()

        t.end()
      })
    })
  })
})

test('replicate (promise)', async t => {
  const piet = TestBot()
  piet.name = 'piet'

  const katie = TestBot()
  katie.name = 'katie'

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }

  const msg = await p(piet.publish)(content)
    .then(msg => { t.pass('piet publishes a message'); return msg })
    .catch(err => t.error(err, 'piet publishes a message'))

  await replicate({ from: piet, to: katie })
    .then(() => t.pass('replicate'))
    .catch(err => t.error(err, 'replicate'))

  const value = await p(katie.get)({ id: msg.key })
    .catch(err => t.error(err, 'katie can get message'))

  t.deepEqual(value.content, content, 'katie can read the msg')
  // should be same as content piet sent, if katie can decrypt

  await Promise.all([
    p(piet.close)(true),
    p(katie.close)(true)
  ])

  t.end()
})

test('replicate (live)', t => {
  const piet = TestBot()
  const katie = TestBot()

  const name = (feedId) => {
    if (feedId === piet.id) return 'piet'
    if (feedId === katie.id) return 'katie'
  }

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }

  pull(
    katie.createHistoryStream({ id: piet.id, live: true }),
    pull.drain(msg => {
      t.deepEqual(msg.value.content, content)

      piet.close(true)
      katie.close(true)
      t.end()
    })
  )
  replicate({ from: piet, to: katie, name, live: true })

  piet.publish(content, () => {})
})

test('replicate (log: false)', async t => {
  const piet = TestBot()
  const katie = TestBot()

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }
  const msg = await p(piet.publish)(content)

  await replicate({ from: piet, to: katie, log: false })

  const value = await p(katie.get)({ id: msg.key, private: true })

  t.deepEqual(value.content, content)

  piet.close()
  katie.close()
  t.end()
})
