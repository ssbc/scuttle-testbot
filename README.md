# scuttletestbot

> Spins up an empty, temporary scuttlebot server that stores data in your temp folder


## Usage

```js
var CreateTestSbot = require('scuttletestbot')

var myTempSbot = CreateTestSbot('testBotName')

// Do sboty things

```

## API

```js
var CreateTestSbot = require('scuttletestbot')
```

```
CreateTestSbot(name, opts={})
```
Returns a scuttlebot instance.
`name` is the name of the folder in your temp directory where the test sbot will store data.
By default, CreateTestSbot deletes an existing database of the same `name` before starting.

Valid `opts` keys include:
`startUnclean` (default: `false`) - `true`: Don't delete an existing database before starting up.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install scuttletestbot
```

## Acknowledgments


## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)

## License

MIT

