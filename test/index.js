var test = require('tape')
var CreateTestSbot = require('../')
var ssbAbout = require('ssb-about');

test('creates an sbot', function(t) {
  var sbot = CreateTestSbot({name: 'piet'})
  t.ok(sbot)
  sbot.close()
  t.end()
})

test('adds an sbot plugin and can be chained', function(t) {
  CreateTestSbot
    .use({init: ()=>{}, name: 'fakePlugin1'})
    .use({init: ()=>{}, name: 'fakePlugin2'})

  sbot = CreateTestSbot()

  t.ok(sbot)
  sbot.close()
  t.end()
})

test('with multi feeds', function(t) {

  var ssbKeys = require('ssb-keys')

  var pietKeys = ssbKeys.generate()
  var katieKeys = ssbKeys.generate()

  var myTempSbot = CreateTestSbot({name: 'testBotName', keys: pietKeys})

  var katie = myTempSbot.createFeed(katieKeys)
  var piet = myTempSbot.createFeed(pietKeys)

  piet.add({type: 'test', content: "a test message"},function(err, data) {
    t.error(err)
    myTempSbot.close() //don't forget to close your sbot otherwise your script will never exit. ;)
    t.end()
  })

})
