const pull = require('pull-stream')
const { promisify } = require('util')

const color = require('color-tag')

const ARROW = '⇒'

const ENCRYPTED_TYPE = '[?]'

function replicate (opts, done) {
  if (!opts.live && !done) return promisify(replicate)(opts)

  const { from, to, live = false, name = defaultName, log = console.log } = opts
  if (live && done) throw new Error('cannot set live && done!')

  const getName = GetName(from, to, name)
  const getType = GetType(getName)

  const fromName = color(getName(from.id), from.id)
  const toName = color(getName(to.id), to.id)

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
            log(`${fromName} [${m.value.sequence}] ${ARROW} ${toName}: ${getType(m)}`)
          } else {
            log(`${color(getSeq(m), from.id)} ${getType(m)}`)
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

  function defaultName (id) {
    const peer = from.id === id ? from : to
    return peer.name || id.slice(0, 10)
  }
}
module.exports = replicate

function GetName (from, to, name) {
  const map = {
    [from.id]: from.name,
    [to.id]: to.name
  }

  return function getName (id) {
    if (map[id]) return map[id]
    return name(id)
  }
}

function getSeq (msg) {
  const seq = msg.value.sequence
  if (seq < 10) return `  ${seq}`
  if (seq < 100) return ` ${seq}`
  return seq
}

function GetType (getName) {
  return function getType (msg) {
    const { type = ENCRYPTED_TYPE, recps } = msg.value.content

    if (type !== 'group/add-member') return type

    const addedMembers = recps
      .filter(recp => !recp.endsWith('cloaked'))
      .map(recp => color(getName(recp), recp))

    return `${type}  ─ ${addedMembers.join(', ')}`
  }
}
