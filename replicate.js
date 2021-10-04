const pull = require('pull-stream')
const { promisify } = require('util')
const ARROW = '─>'
const ENCRYPTED_TYPE = '[?]'

function replicate ({ from, to, live = false, name = defaultName }, done) {
  if (live && done) throw new Error('cannot set live && done!')
  if (!live && !done) return promisify(replicate)({ from, to, name })

  const fromName = name(from.id)
  const toName = name(to.id)

  to.getFeedState(from.id, (err, state) => {
    if (err) throw err

    if (!live) console.log(`${fromName} ${ARROW} ${toName}`)

    const start = state.sequence + 1
    pull(
      from.createHistoryStream({ id: from.id, seq: start, live }),
      pull.filter(m => m.sync !== true),
      pull.asyncMap((m, cb) => to.add(m.value, cb)),
      pull.asyncMap((m, cb) =>
        to.get({ id: m.key, private: true, meta: true }, cb)
      ),
      pull.drain(
        (m) => {
          if (live) liveLog(m, fromName, toName, name)
          else {
            console.log(`${getSeq(m)} ${getType(m, name)}`)
          }
        },
        (err) => {
          if (typeof done === 'function') return done(err)
          if (err) {
            throw err
          }
        }
      )
    )
  })
}
module.exports = replicate

function defaultName (key) {
  return key.slice(0, 9)
}

function liveLog (msg, fromName, toName, name) {
  console.log(`${fromName} [${msg.value.sequence}] ${ARROW} ${toName}: ${getType(msg, name)}`)
}

function getSeq (msg) {
  const seq = msg.value.sequence
  if (seq < 10) return `  ${seq}`
  if (seq < 100) return ` ${seq}`
  return seq
}

function getType (msg, name) {
  const { type = ENCRYPTED_TYPE, recps } = msg.value.content

  const addedMembers = type === 'group/add-member'
    ? ` ─ ${recps.filter(r => r[0] === '@').map(name)}`
    : ''

  return type + addedMembers
}
