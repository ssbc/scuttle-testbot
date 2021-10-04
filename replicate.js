const pull = require('pull-stream')
const { promisify } = require('util')

const color = require('./color')

const ARROW = '─>'
const ENCRYPTED_TYPE = '[?]'

function replicate (opts, done) {
  if (!opts.live && !done) return promisify(replicate)(opts)

  const { from, to, live = false, name = defaultName, log = console.log } = opts
  if (live && done) throw new Error('cannot set live && done!')

  const fromColor = color(name(from.id))
  const fromName = fromColor(name(from.id))
  const toName = color(name(to.id))(name(to.id))

  to.getFeedState(from.id, (err, state) => {
    if (err) throw err

    if (!live && log) log(`${fromName} ${ARROW} ${toName}`)

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
          if (!log) return

          if (live) {
            log(`${fromName} [${m.value.sequence}] ${ARROW} ${toName}: ${getType(m, name)}`)
          } else {
            log(`${fromColor(getSeq(m))} ${getType(m, name)}`)
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
