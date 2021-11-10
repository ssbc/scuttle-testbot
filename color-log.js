const color = require('color-tag')

module.exports = function colorLog (...args) {
  console.log(...args.map(colorize))
}

function colorize (obj) {
  let output = JSON.stringify(obj, null, 2)

  const regex = /(@|%|&)[^"]+/g
  const matches = Array.from(new Set(output.match(regex)))

  output = output.split('\n')
    .map(line => {
      const out = matches.reduce(
        (line, match) => line.replace(`"${match}"`, color(match)),
        line
      )
      return out
    })
    // .map(line => `\x1b[30m${line}\x1b[0m`)
    .join('\n')

  return output.replace(/"([^"]+)":/g, '$1:')
}
