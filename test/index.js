var test = require('tape')
var CreateTestSbot = require('../')

test('creates an sbot', function (t) {
  var sbot = CreateTestSbot({name: 'piet'})
  t.ok(sbot)
  sbot.close()
  t.end()
})

test('adds an sbot plugin and can be chained', function (t) {
  CreateTestSbot
    .use({init: () => {}, name: 'fakePlugin1'})
    .use({init: () => {}, name: 'fakePlugin2'})

  var sbot = CreateTestSbot()

  t.ok(sbot)
  sbot.close()
  t.end()
})

test('multi sbots that share some of the same plugins', function (t) {
  CreateTestSbot
    .use({init: () => {}, name: 'fakePlugin1'})

  var sbot1 = CreateTestSbot()
  t.ok(sbot1)

  CreateTestSbot
    .use({init: () => {}, name: 'fakePlugin1'})
    .use({init: () => {}, name: 'fakePlugin2'})

  var sbot2 = CreateTestSbot()
  t.ok(sbot2)

  sbot1.close()
  sbot2.close()
  t.end()
})
