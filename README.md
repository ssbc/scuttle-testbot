# scuttle-testbot

> Spins up an empty, temporary ssb-server that stores data in your temp folder


## Usage

```js
var TestBot = require('scuttle-testbot')

var piet = TestBot()

piet.publish({type: 'test', content: "a test message"}, (err, msg) => {
  console.log(msg)
  piet.close()
})
```

Outputs:
```
{
  key: '%FQ2auS8kVY9qPgpTWNY3le/JG5+IlO6JHDjBIQcSPSc=.sha256',
  value: {
    previous: null,
    sequence: 1,
    author: '@UreG2i/rf4mz7QAVOtg0OML5SRRB42Cwwl3D1ct0mbU=.ed25519',
    timestamp: 1517190039755,
    hash: 'sha256',
    content: { type: 'test', content: 'a test message' },
    signature: '0AxMJ7cKjHQ6vJDPkVNWcGND4gUwv2Z8barND5eha7ZXH/s5T0trFqcratIqzmhE3YJU2FY61Rf1S/Za2foLCA==.sig.ed25519'
  },
  timestamp: 1517190039758
}
```

## API

```js
var TestBot = require('scuttle-testbot')
```

### `TestBot(opts = {})`

Returns a ssb-server instance.

By default, CreateTestSbot deletes an existing database of the same `name` before starting.

Valid `opts` keys include:
- `name` *String* (optional) (default: `ssb-test + Number(new Date)`)
- `path` *String* (optional) (default: `/tmp/${name}`, where `name` is the above)
    - `~/.ssb-test`: Sets the database in `~/.ssb-test`
- `keys` *String* (optional) (default: scuttle-testbot generates a new set of random keys)
    - you can create your own keys with `ssbKeys.generate()`
- `startUnclean` (default: `false`)
    - `true`: Don't delete an existing database before starting up.
    - this is useful if you want to test state after stopping and starting a server. In this case you need to set the `name` and `keys` options to be connecting to the same log
- `db2` (default: `false`)

### `TestBot.use(plugin)`

`CreateTestSbot.use` lets you add ssb-server plugins. `use` can be chained the same as the ssb-server api.

Example:

```js
function Server (opts) {
  const stack = Testbot
    .use('ssb-master')
    .use('ssb-tribes')

  return stack(opts)
}
```

### `Testbot.replicate({ from, to, live, name }, done)`

Replicates data from one testbot to another, which is sometimes needed when you have functions
which are only triggered by _another_ feedId, e.g. when I am added to a private group someone else started.

Example:

```js
const piet = TestBot()
const katie = TestBot()

const content = {
  type: 'direct-message',
  text: 'oh hey'
}

piet.publish(content, (err, msg) => {
  TestBot.replicate({ from: piet, to: katie }, (err) => {
    katie.get({ id: msg.key, private: true }, (err, value) => {

      console.log(value.content)
      // should be same as content piet sent, if katie can decrypt

      piet.close()
      katie.close()
    })
  })
})
```

arguments:
- `from` *SSB* - an ssb instance to be replicated from. This will replicate only this feeds messages (not everything in log)
- `to` *SSB* - an ssb instance being replicate to.
- `live` *Boolean* (optional)- whether or not to keep replication running (default: `false`).
- `name` *Function* (optional) - makes logged output easier to read by allowing you to replace feedIds with human readable names
    ```js
    // example
    const name = (feedId) => {
      if (feedId === piet.id) return 'piet'
      if (feedId === katie.id) return 'katie'
    }
    ```
- `done` *Function* - an optional callback which is triggered when the replication is complete or if there is an error.
    - If `live === true` this will ony be called on an error. Signature `done (err) { ... }`

Under the hood this just uses `createHistoryStream` directly from one peer to another



### `Testbot.connect(peers, { names, friends }, done)`

Connects all listed peers.

Example:

```js
const crypto = require('crypto')

const Server = (opts) => {
  const stack = require('scuttle-testbot')
    .use('ssb-friends') // only needed if opts.friends

  return stack(opts)
}

const caps = { shs: crypto.randomBytes(32).toString('base64') }
const piet = Server({ caps })
const katie = Server({ caps })
// all peers need to have same caps to be able to connect to each other

Testbot.connect([piet, katie], { friends: true }, (err) => {
  // as friends: true - piet now follows katie + vice versa
  // and there is a connection live between these two

  piet.close()
  katie.close()
})
```

arguments:
- `peers` *Array*
    - a collection of ssb instances which will all be connected to one another
    - NOTE: by default scuttle-testbot creates random caps for each instance. You need to overide this as in example to form connections

- `friends` *Boolean* (optional)
    - if true will get each peer to publish a follow for each other peer in the list
    - NOTE: this requires `ssb-friends` to be installed
    - default: `false`
- `name` *Function* (optional) - makes logged output easier to read by allowing you to replace feedIds with human readable names
    ```js
    // example
    const name = (feedId) => {
      if (feedId === piet.id) return 'piet'
      if (feedId === katie.id) return 'katie'
    }
    ```
- `done` *Function* - an optional callback which is triggered when the replication is complete or if there is an error.
    - If `live === true` this will ony be called on an error. Signature `done (err) { ... }`

Under the hood this just uses `createHistoryStream` directly from one peer to another


## License

MIT

