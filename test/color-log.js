const test = require('tape')
const { colorLog } = require('../')

test('colorLog', t => {
  colorLog('test', null, 6)

  colorLog({ a: 1, b: [0, 1, 0] })

  colorLog({
    type: 'group/add-member',
    version: 'v1',
    groupKey: 'VuRsYvXc9MPLnnX9YEiKhpcRMKKI7I3tCs9HWhdxPjs=',
    root: '%VvIf7Z5/bvhsGeiFo/FMvJ3HqVhdqIEj+ZpFZJCuQ7M=.sha256',
    tangles: {
      members: {
        root: '%VvIf7Z5/bvhsGeiFo/FMvJ3HqVhdqIEj+ZpFZJCuQ7M=.sha256',
        previous: [
          '%VvIf7Z5/bvhsGeiFo/FMvJ3HqVhdqIEj+ZpFZJCuQ7M=.sha256'
        ]
      },
      group: {
        root: '%VvIf7Z5/bvhsGeiFo/FMvJ3HqVhdqIEj+ZpFZJCuQ7M=.sha256',
        previous: [
          '%b+skPAuy9IjKXI4tEq0mGHDqP8BgmNUfvMcKlt1okCY=.sha256'
        ]
      }
    },
    recps: [
      '%wU6AiyTpucZWirFMBIoqFlfek9d+RuGRlxcLc+TImoA=.cloaked',
      '@CVjpRMtSEzVlAcE4FX0vTNhe8LaIvLbicnirTzZmRX8=.ed25519'
    ]
  })

  t.end()
})
