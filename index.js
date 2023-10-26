const ssbKeys = require('ssb-keys')
const crypto = require('crypto')
const { join } = require('path')
const rimraf = require('rimraf')
const os = require('os')

const replicate = require('./replicate')
const connect = require('./connect')
const colorLog = require('./color-log')

let plugins = []

function createTestBot (opts = {}) {
  if (!opts.name) { opts.name = randomName() }
  if (!opts.path) { opts.path = join(os.tmpdir(), opts.name) }
  if (!opts.keys) { opts.keys = ssbKeys.generate() }

  opts.conn = {
    autostart: false,
    ...opts.conn
  }

  opts.db2 = {
    // tune db2 for quick write then read (instead of bulk write)
    addBatchThrottle: 50,
    writeTimeout: 50,
    ...opts.db2
  }

  const caps = {
    shs: crypto.randomBytes(32).toString('base64'),
    ...opts.caps
  }

  const createSbot = require('secret-stack')({ caps })
  
  if (process.env.SSB_DB1 || opts.db1) {
    createSbot.use(require('ssb-db'))
  } else if (opts.noUse) {
    // no use
  } else {
    createSbot.use(require('ssb-db2'))
  }

  plugins.forEach(plugin => createSbot.use(plugin))
  plugins = []

  if (
    opts.startUnclean !== true &&
    opts.rimraf !== false
  ) { rimraf.sync(opts.path) }

  const sbot = createSbot(opts)
  if (!sbot.name) sbot.name = opts.name
  return sbot
}

createTestBot.use = function use (plugin) {
  plugins.push(plugin)
  return createTestBot
}
createTestBot.replicate = replicate
createTestBot.connect = connect
createTestBot.colorLog = colorLog

module.exports = createTestBot

function randomName () {
  return `ssb-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
