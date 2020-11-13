const ssbKeys = require('ssb-keys')
const crypto = require('crypto')
const { join } = require('path')
const rimraf = require('rimraf')
const os = require('os')

const replicate = require('./replicate')

var plugins = []

function createTestBot (opts = {}) {
  if (!opts.name) {
    opts.name = `ssb-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }
  const folderPath = join('/tmp', opts.name)
  if (!opts.startUnclean) { rimraf.sync(folderPath) }
  if (!opts.keys) { opts.keys = ssbKeys.generate() }

  var caps = {
    shs: (opts.caps && opts.caps.shs) || crypto.randomBytes(32).toString('base64')
  }
  var createSbot = require('secret-stack')({ caps })
    .use(require('ssb-db'))
    .use(require('ssb-conn'))

  if (createSbot.createSbot) { createSbot = createSbot.createSbot() }
  plugins.forEach(plugin => createSbot.use(plugin))
  plugins = []

  return createSbot({
    ...opts,
    path: join(os.tmpdir(), opts.name)
  })
}

createTestBot.use = function use (plugin) {
  plugins.push(plugin)
  return createTestBot
}
createTestBot.replicate = replicate

module.exports = createTestBot
