const should = require('should');
const { toList } = require('../../../api/services/mapping/utils');

describe('toList utils', () => {
  it('should apply a function to a list of object', async () => {
    function toSimpleCave(source) {
      return { id: source.id, name: source.name };
    }

    const testData = {
      caves: [
        {
          id: 1,
          name: 'test',
          other: 'other',
          isDeleted: true,
        },
        {
          id: 2,
          name: 'test2',
          other: 'other2',
          isDeleted: false,
        },
      ],
      cave: {
        id: 1,
        name: 'test',
        other: 'other',
        isDeleted: true,
      },
      noDeleted: [
        {
          id: 1,
          name: 'test',
          other: 'other',
        },
        {
          id: 2,
          name: 'test2',
          other: 'other2',
        },
      ],
    };

    const res = toList('caves', testData, toSimpleCave, {
      filterDeleted: false,
    });
    should(res).deepEqual([
      { id: 1, name: 'test' },
      { id: 2, name: 'test2' },
    ]);
    const res2 = toList('caves', testData, toSimpleCave, {
      filterDeleted: true,
    });
    should(res2).deepEqual([{ id: 2, name: 'test2' }]);

    // If data[key] is not an Array, return it as is.
    const res3 = toList('cave', testData, toSimpleCave, {
      filterDeleted: false,
    });
    should(res3).deepEqual({
      id: 1,
      name: 'test',
      other: 'other',
      isDeleted: true,
    });

    const res4 = toList('cave', testData, toSimpleCave, {
      filterDeleted: true,
    });
    should(res4).deepEqual(null);

    const res5 = toList('noDeleted', testData, toSimpleCave, {
      filterDeleted: true,
    });
    should(res5).deepEqual([
      { id: 1, name: 'test' },
      { id: 2, name: 'test2' },
    ]);
  });
});
