const should = require('should');
const getAllPaths = require('../../../api/utils/getAllPaths');

describe('getAllPaths util', () => {
  it('should get all paths to the key "entrances"', async () => {
    const testData = {
      name: 'test',
      entrances: [{ id: 1 }, { id: 2 }],
      caves: [
        {
          id: 1,
          entrances: [{ id: 1 }, { id: 2 }],
        },
      ],
      caver: {
        id: 42,
        exploredEntrances: [{ id: 1 }],
      },
      entrance: {
        id: 4,
      },
    };

    const res = getAllPaths(testData, 'entrances');
    should(res).deepEqual([
      'entrances',
      'caves.0.entrances',
      'caver.exploredEntrances',
    ]);
  });
});
