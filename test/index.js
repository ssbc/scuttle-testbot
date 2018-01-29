var test = require('tape')
var CreateTestSbot = require('../')

test('creates an sbot', function(t) {
  var sbot = CreateTestSbot('piet')
  t.ok(sbot)
  sbot.close()
  t.end()
})

test('with multi feeds', function(t) {

  var ssbKeys = require('ssb-keys')

  var pietKeys = ssbKeys.generate()
  var katieKeys = ssbKeys.generate()

  var myTempSbot = CreateTestSbot('testBotName', {keys: pietKeys})

  var katie = myTempSbot.createFeed(katieKeys)
  var piet = myTempSbot.createFeed(pietKeys)

  piet.add({type: 'test', content: "a test message"},function(err, data) {
    t.error(err)
    myTempSbot.close() //don't forget to close your sbot otherwise your script will never exit. ;)
    t.end()
  })

})
