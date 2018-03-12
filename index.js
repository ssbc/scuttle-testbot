var ssbKeys = require('ssb-keys')
var path = require('path')
var rimraf = require('rimraf')

var plugins = []

function createTestBot (opts) {
  opts = opts || {}

  var createSbot = require('scuttlebot')
  if (createSbot.createSbot) { createSbot = createSbot.createSbot() }

  if (!opts.name) { opts.name = 'ssb-test-' + Number(new Date()) }

  let folderPath = path.join('/tmp', opts.name)

  if (!opts.startUnclean) { rimraf.sync(folderPath) }

  if (!opts.keys) { opts.keys = ssbKeys.generate() }

  plugins.forEach(plugin => createSbot.use(plugin))
  plugins = []

  return createSbot(Object.assign({}, opts, {temp: opts.name}))
}

createTestBot.use = function (plugin) {
  plugins.push(plugin)
  return createTestBot
}

module.exports = createTestBot
