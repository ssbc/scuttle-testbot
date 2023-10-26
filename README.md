# scuttle-testbot

> Spins up an empty, temporary ssb-server that stores data in your temp folder


## Usage

```js
const TestBot = require('scuttle-testbot')

const piet = TestBot()
const content = { type: 'test', text: "a test message" }

piet.db.create publish({ content }, (err, msg) => {
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
const TestBot = require('scuttle-testbot')
```

### `TestBot(opts = {})`

Returns a ssb-server instance.

By default, CreateTestSbot deletes an existing database of the same `name` before starting.

Valid `opts` keys include:
- `opts.name` *String* (optional) (default: `ssb-test + Number(new Date)`)
- `opts.path` *String* (optional) (default: `/tmp/${name}`, where `name` is the above)
    - `~/.ssb-test`: Sets the database in `~/.ssb-test`
- `opts.keys` *String* (optional) (default: scuttle-testbot generates a new set of random keys)
    - you can create your own keys with `ssbKeys.generate()`
- `opts.rimraf` (default: `true`)
    - `false`: Don't delete an existing database before starting up.
    - this is useful if you want to test state after stopping and starting a server. In this case you need to set the `name` and `keys` options to be connecting to the same log
    - note `opts.startUnclean` is still accepted
- `opts.db1` (default: `false`)
    - uses `ssb-db2` by default, but if `true` will use `ssb-db`
    - your can also switch to db1 by setting the ENV `SSB_DB1=true`
- `opts.noUse` (default: `false`)
    - if true then the testbot uses neither db1 nor db2 by default, leaving that up to you. Useful e.g. in case you want to control what plugins get imported along with db2.

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

### `Testbot.replicate({ from, to, feedId?, live?, name?, log? }, done)`

Replicates data from one testbot to another, which is sometimes needed when you have functions
which are only triggered by _another_ feedId, e.g. when I am added to a private group someone else started.

Example:

```js
function Server (opts) {
  const stack = require('scuttle-testbot')
    // required for replicate
    .use(require('ssb-db2/compat/feedstate'))
    .use(require('ssb-db2/compat/history-stream'))

  return stack(opts)
}
const piet = Server({ name: 'piet' })
const katie = Server({ name: 'katie' })

const content = {
  type: 'direct-message',
  text: 'oh hey'
}

piet.db.create({ content }, (err, msg) => {
  TestBot.replicate({ from: piet, to: katie }, (err) => {
    katie.db.getMsg(msg.key, private: true }, (err, value) => {

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
- `feedId` *String* (optional)
    - the id of the feed you would like to replicate from one peer to another
    - default: `from.id`
- `live` *Boolean* (optional)- whether or not to keep replication running (default: `false`).
    - provide a custom logging function, or disable the logging by setting this `false`
    - default: `console.log`
- `name` *Function* (optional) - makes logged output easier to read by allowing you to replace feedIds with human readable names
    ```js
    // example
    const name = (feedId) => {
      if (feedId === piet.id) return 'piet'
      if (feedId === katie.id) return 'katie'
    }
    ```
    - alternatively, if an instance has a "name" property, then that will be used, e.g.
        ```js
        const piet = TestBot()
        piet.name = 'piet'
        ```
        ```js
        const piet = TestBot({ name: 'katie ' })
        ```
- `log` *Function|false* (optional)
- `done` *Function* - an optional callback which is triggered when the replication is complete or if there is an error.
    - If `live === true` this will ony be called on an error. Signature `done (err) { ... }`

Also supports promise style.
```js
  await TestBot.replicate({ from: piet, to: katie })
```
This requires that `live: false`

Under the hood this function just uses `createHistoryStream` directly from one peer to another

### `Testbot.connect(peers, { names, friends }, done)`

Connects all listed peers.

Example:

```js
const crypto = require('crypto')

function Server (opts) {
  const stack = require('scuttle-testbot')
    .use('ssb-conn')
    .use('ssb-friends') // only needed if opts.friends

  return stack(opts)
}

const caps = { shs: crypto.randomBytes(32).toString('base64') }
const piet = Server({ caps, name: 'piet' })
const katie = Server({ caps, name: 'katie' })
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

- `opts` *Object*
    - `opts.friends` *Boolean* (optional)
        - if true will get each peer to publish a follow for each other peer in the list
        - NOTE: this requires `ssb-friends` to be installed
        - default: `false`
    - `opts.name` *Function* (optional) - makes logged output easier to read by allowing you to replace feedIds with human readable names
        ```js
        // example
        const name = (feedId) => {
          if (feedId === piet.id) return 'piet'
          if (feedId === katie.id) return 'katie'
        }
        ```
    - `opts.log` *Function|false* (optional)
        - provide a custom logging function, or disable the logging by setting this `false`
        - default: `console.log`

- `done` *Function* - an optional callback which is triggered when the replication is complete or if there is an error.
    - If `live === true` this will ony be called on an error. Signature `done (err) { ... }`

Under the hood this just uses `createHistoryStream` directly from one peer to another

Also supports promise style.
```js
  await Testbot.connect([piet, katie], { friends: true })
```

### `TestBot.colorLog(obj, ...)`

Like `console.log(JSON.stringify(obj, null, 2))` but also:
- colorises the cipherlinks based on value - makes it easier to pattern-match across messages
- removes quotes-marks from keys - easier to read
- takes multiiple input values


## License

MIT

