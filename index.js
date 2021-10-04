const ssbKeys = require('ssb-keys')
const crypto = require('crypto')
const { join } = require('path')
const rimraf = require('rimraf')
const os = require('os')

const replicate = require('./replicate')
const connect = require('./connect')

let plugins = []

function createTestBot (opts = {}) {
  if (!opts.name) {
    opts.name = `ssb-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }
  if (!opts.path) {
    opts.path = join(os.tmpdir(), opts.name)
  }
  if (!opts.startUnclean) { rimraf.sync(opts.path) }
  if (!opts.keys) { opts.keys = ssbKeys.generate() }

  if (!opts.conn) opts.conn = {}
  if (typeof opts.conn.autostart !== 'boolean') opts.conn.autostart = false

  const caps = {
    shs: (opts.caps && opts.caps.shs) || crypto.randomBytes(32).toString('base64')
  }
  let createSbot = require('secret-stack')({ caps })
    .use(require('ssb-conn'))

  if (opts.db2) createSbot.use(require('ssb-db2'))
  else createSbot.use(require('ssb-db'))

  if (createSbot.createSbot) { createSbot = createSbot.createSbot() }
  plugins.forEach(plugin => createSbot.use(plugin))
  plugins = []

  return createSbot(opts)
}

createTestBot.use = function use (plugin) {
  plugins.push(plugin)
  return createTestBot
}
createTestBot.replicate = replicate
createTestBot.connect = connect

module.exports = createTestBot
