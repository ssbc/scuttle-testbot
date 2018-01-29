var test = require('tape')
var createTestSbot = require('../')

test('creates an sbot', function(t) {
  var sbot = createTestSbot('piet')
  t.ok(sbot)
  sbot.close()
  t.end()
})
