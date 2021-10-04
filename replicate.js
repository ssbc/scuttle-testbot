const pull = require('pull-stream')
const { promisify } = require('util')

function replicate ({ from, to, live = false, name = defaultName }, done) {
  if (live && done) throw new Error('cannot set live && done!')
  if (!live && !done) return promisify(replicate)({ from, to, name })

  const fromName = name(from.id)
  const toName = name(to.id)

  to.getFeedState(from.id, (err, state) => {
    if (err) throw err

    if (!live) process.stdout.write(`\r    ${fromName} ─> ${toName}\n`)

    const start = state.sequence + 1
    let type
    let lastType
    let sameCount = []
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
            sameCount.push(m.value.sequence)

            type = getType(m, name)
            if (lastType && type !== lastType) {
              if (sameCount.length) {
                process.stdout.write('\n')
                sameCount = []
              }
              process.stdout.write(`\r      [${m.value.sequence}]: ${type}`)
            } else {
              process.stdout.write(`\r      [${sameCount.join(',')}]: ${type}`)
            }

            lastType = type
          }
        },
        (err) => {
          process.stdout.write('\n')
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
  console.log(` ${fromName}[${msg.value.sequence}] ─> ${toName}: ${getType(msg, name)}`)
}

function getType (msg, name) {
  const { type = '???', recps } = msg.value.content

  const addedMembers = type === 'group/add-member'
    ? ` (${recps.filter(r => r[0] === '@').map(name)}) `
    : ''

  return type + addedMembers
}
