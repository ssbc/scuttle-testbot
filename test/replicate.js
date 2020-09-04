var test = require('tape')
const pull = require('pull-stream')
var TestBot = require('../')

test('replicate', t => {
  const piet = TestBot()
  const katie = TestBot()

  const name = (feedId) => {
    if (feedId === piet.id) return 'piet'
    if (feedId === katie.id) return 'katie'
  }

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }

  piet.publish(content, (err, msg) => {
    if (err) throw err

    TestBot.replicate({ from: piet, to: katie, name }, (err) => {
      if (err) throw err

      katie.get({ id: msg.key, private: true }, (err, value) => {
        if (err) throw err

        t.deepEqual(value.content, content)
        // should be same as content piet sent, if katie can decrypt

        piet.close()
        katie.close()

        t.end()
      })
    })
  })
})

test('replicate (live)', t => {
  const piet = TestBot()
  const katie = TestBot()

  const name = (feedId) => {
    if (feedId === piet.id) return 'piet'
    if (feedId === katie.id) return 'katie'
  }

  const content = {
    type: 'direct-message',
    text: 'oh hey'
  }

  pull(
    katie.createHistoryStream({ id: piet.id, live: true }),
    pull.drain(msg => {
      t.deepEqual(msg.value.content, content)

      piet.close()
      katie.close()
      t.end()
    })
  )
  TestBot.replicate({ from: piet, to: katie, name, live: true })

  piet.publish(content, () => {})
})
