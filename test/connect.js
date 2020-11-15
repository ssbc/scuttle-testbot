const test = require('tape')
const crypto = require('crypto')
const pull = require('pull-stream')
const { connect } = require('..')

const Server = (opts) => {
  const stack = require('..')
    .use(require('ssb-friends'))
    .use(require('ssb-replicate'))

  return stack(opts)
}

test('connect', t => {
  const caps = {
    shs: crypto.randomBytes(32).toString('base64')
  }
  const alice = Server({ caps })
  const bob = Server({ caps })
  const cherese = Server({ caps })
  const name = (id) => {
    if (id === alice.id) return 'alice'
    if (id === bob.id) return 'bob'
    if (id === cherese.id) return 'cherese'
  }

  bob.publish({ type: 'greetings' }, (err) => {
    t.error(err, 'bob publishes a greeting')
  })

  connect([alice, bob, cherese], { name, friends: true }, (err) => {
    t.error(err, 'alice an bob connected!')

    pull(
      alice.createHistoryStream({ id: bob.id, live: true }),
      pull.filter(m => !m.sync),
      pull.map(m => m.value.content),
      pull.drain(content => {
        if (content.type === 'greetings') {
          t.pass('alice replicated bobs greeting')
          alice.close()
          bob.close()
          cherese.close()
          t.end()
        }
      })
    )
  })
})

test('connect different caps!', t => {
  const alice = Server()
  const bob = Server()

  connect([alice, bob], { friends: true }, (err) => {
    console.log('^ expected logged error :)')
    t.match(err.message, /different application cap/, 'cannot connect across different caps')

    alice.close()
    bob.close()
    t.end()
  })
})
