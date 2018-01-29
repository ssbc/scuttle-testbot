var ssbKeys = require('ssb-keys')
var path = require('path');
var rimraf = require('rimraf')

var createSbot = require('scuttlebot')

var plugins = []

function createTestBot(opts) {
  opts = opts || {}

  if(!opts.name)
    opts.name = "ssb-test-" + Number(new Date())

  let folderPath = path.join("/tmp", opts.name)

  if(!opts.startUnclean)
    rimraf.sync(folderPath)

  if(!opts.keys)
    var keys = ssbKeys.generate()

  if(plugins.length)
    plugins.forEach(plugin => createSbot.use(plugin))

  return createSbot({keys, temp: opts.name})
}

createTestBot.use = function(plugin) {
  plugins.push(plugin)
}

module.exports = createTestBot 
