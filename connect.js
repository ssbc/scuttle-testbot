const pull = require('pull-stream')
const pullParaMap = require('pull-paramap')

module.exports = function connect (peers, opts = {}, cb) { // eslint-disable-line
  if (!opts.friends) return allConnect(peers, opts, cb)

  allFriends(peers, (err, data) => {
    if (err) return cb(err)

    allConnect(peers, opts, cb)
  })
}

function allFriends (peers, done) {
  // for each peer
  // follow each other peer!

  pull(
    pull.values(peers),
    pullParaMap(
      (peer, cb) => {
        pull(
          pull.values(peers),
          pullParaMap(
            (_peer, _cb) => {
              if (_peer.id === peer.id) return _cb(null)

              peer.friends.follow(_peer.id, {}, _cb)
            },
            10
          ),
          pull.collect(cb)
        )
      },
      10
    ),
    pull.collect(done)
  )
}

function allConnect (peers, opts, done) {
  const connections = new Set()
  const name = opts.name || abbrev

  pull(
    pull.values(peers),
    pullParaMap(
      (peer, cb) => {
        pull(
          pull.values(peers),
          pullParaMap(
            (_peer, _cb) => {
              if (_peer.id === peer.id) return _cb(null)

              const pair = [peer.id, _peer.id].sort()
              if (connections.has(pair.join())) return _cb(null)
              connections.add(pair.join())

              peer.conn.start()
              // NOTE: I have disabled conn autostart in config
              // I have put this conn.start call in here to make sure the scheduler
              // is started, so no problems with conn.connect?
              // I don't actually know if this is needed!!!
              peer.conn.connect(_peer.getAddress(), (err, rpc) => {
                if (err) return _cb(err)
                console.log(pair.map(name).join(' ┄─┄ '))
                cb(null, rpc)
              })
            },
            10
          ),
          pull.collect(cb)
        )
      },
      10
    ),
    pull.collect(done)
  )
}

function abbrev (id) {
  return id.slice(0, 10)
}
