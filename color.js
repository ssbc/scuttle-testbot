
const colors = [
  (str) => `\x1b[31m${str}\x1b[0m`, // red
  (str) => `\x1b[32m${str}\x1b[0m`, // green
  (str) => `\x1b[33m${str}\x1b[0m`, // yellow
  (str) => `\x1b[34m${str}\x1b[0m`, // blue
  (str) => `\x1b[35m${str}\x1b[0m`, // magenta
  (str) => `\x1b[36m${str}\x1b[0m` //  cyan
]
let count = 0
const colorMap = {} // id ─> count

// this function takes in an "id" and returns a coloring function
// colors are chosen from the list above, an id has been seen before the
// same coloring function is returned
//
// the motivation is to be able to color things similarly across test to make
// them easier to identify

module.exports = function color (id) {
  if (!colorMap[id]) {
    count++
    colorMap[id] = count
  }

  return colors[colorMap[id] % colors.length]
}
