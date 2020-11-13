const test = require('tape')
const crypto = require('crypto')
const Server = require('../')

test.only('connect', t => {
  const caps = {
    shs: crypto.randomBytes(32).toString('base64')
  }
  const alice = Server
    .use(require('ssb-friends'))
    .use(require('ssb-replicate'))
    .call(null, { caps })

  const bob = Server
    .use(require('ssb-friends'))
    .use(require('ssb-replicate'))
    .call(null, { caps })

  alice.conn.connect(bob.getAddress())

  setTimeout(
    () => {
      alice.close()
      bob.close()
      t.end()
    },
    3e3
  )
})
