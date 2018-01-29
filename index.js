var ssbKeys = require('ssb-keys')
var path = require('path');
var rimraf = require('rimraf')

var createSbot = require('scuttlebot')

function createTestBot(name, opts) {
  let folderPath = path.join("/tmp/", name)

  if(opts && !opts.startUnclean)
    rimraf.sync(folderPath)

  if(opts && !opts.keys)
    var keys = ssbKeys.generate()

  return createSbot({keys, temp: name})
}

module.exports = createTestBot 
