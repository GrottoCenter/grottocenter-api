const should = require('should');
const readSkipLimit = require('../../../api/utils/readSkipLimit');

const { LIMIT_DEFAULT, LIMIT_MAX } = readSkipLimit;

// https://github.com/GrottoCenter/grottocenter-api/issues/1931
describe('readSkipLimit - Unit Tests', () => {
  it('defaults to skip 0 and limit 50', () => {
    should(LIMIT_DEFAULT).equal(50);
    should(readSkipLimit(undefined, undefined)).deepEqual({
      skip: 0,
      limit: LIMIT_DEFAULT,
    });
  });

  it('reads query-string values', () => {
    should(readSkipLimit('20', '10')).deepEqual({ skip: 20, limit: 10 });
  });

  it('reads numbers', () => {
    should(readSkipLimit(5, 7)).deepEqual({ skip: 5, limit: 7 });
  });

  [
    ['a negative skip', '-5', undefined, { skip: 0, limit: LIMIT_DEFAULT }],
    ['limit 0', undefined, '0', { skip: 0, limit: 1 }],
    ['a negative limit', undefined, '-3', { skip: 0, limit: 1 }],
    ['the maximum limit', undefined, '100', { skip: 0, limit: LIMIT_MAX }],
    ['a limit above the maximum', undefined, '500', { skip: 0, limit: 100 }],
    ['non-numeric values', 'abc', 'xyz', { skip: 0, limit: LIMIT_DEFAULT }],
    ['empty values', '', '', { skip: 0, limit: LIMIT_DEFAULT }],
  ].forEach(([label, skip, limit, expected]) => {
    it(`clamps ${label}`, () => {
      should(readSkipLimit(skip, limit)).deepEqual(expected);
    });
  });
});
