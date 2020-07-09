var ssbKeys = require('ssb-keys')
var crypto = require('crypto')
var path = require('path')
var rimraf = require('rimraf')
const os = require('os')

var plugins = []

function createTestBot (opts) {
  opts = opts || {}

  var caps = {
    shs: crypto.randomBytes(32).toString('base64')
  }
  var createSbot = require('secret-stack')({ caps })
    .use(require('ssb-db'))

  if (createSbot.createSbot) { createSbot = createSbot.createSbot() }

  if (!opts.name) {
    opts.name = `ssb-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  let folderPath = path.join('/tmp', opts.name)

  if (!opts.startUnclean) { rimraf.sync(folderPath) }

  if (!opts.keys) { opts.keys = ssbKeys.generate() }

  plugins.forEach(plugin => createSbot.use(plugin))
  plugins = []

  return createSbot(Object.assign({}, opts, { path: path.join(os.tmpdir(), opts.name) }))
}

createTestBot.use = function (plugin) {
  plugins.push(plugin)
  return createTestBot
}

module.exports = createTestBot
