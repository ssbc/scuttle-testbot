const test = require('tape')
const crypto = require('crypto')
const pull = require('pull-stream')
const { connect } = require('..')

const isDB2 = !process.env.SSB_DB1

function Server (opts) {
  const stack = require('..')

  if (isDB2) stack.use(require('ssb-db2/compat'))

  stack
    .use(require('ssb-conn'))
    .use(require('ssb-friends'))
    .use(require('ssb-replicate')) // required by this version of friends

  return stack(opts)
}

test('connect', t => {
  t.plan(isDB2 ? 4 : 5)

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

  t.teardown(() => {
    alice.close()
    bob.close()
    cherese.close()
  })

  alice.on('rpc:connect', (rpc) => {
    if (rpc.id === bob.id) t.pass('alice connected to bob!')
    else if (rpc.id === cherese.id) t.pass('alice connected to cherese!')
    else t.fail('unknown peer ' + rpc.id)
  })

  connect([alice, bob, cherese], { name, friends: true }, (err) => {
    t.error(err, 'happily connected')

    // Test if auto-replication because of friends (follows) + ssb-replicate
    // is working
    if (isDB2) return t.end()
    // currently doesn't work with db2

    pull(
      alice.createHistoryStream({ id: bob.id, live: true }),
      pull.filter(m => !m.sync),
      pull.map(m => m.value.content),
      pull.drain(content => {
        if (content.type === 'greetings') {
          t.pass('alice replicated bobs greeting')
        }
      })
    )
  })

  bob.publish({ type: 'greetings' }, (err) => {
    t.error(err, 'bob publishes a greeting')
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
