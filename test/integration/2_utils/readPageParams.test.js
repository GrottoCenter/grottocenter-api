const should = require('should');
const readPageParams = require('../../../api/utils/readPageParams');

const { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } = readPageParams;

describe('readPageParams - Unit Tests', () => {
  it('defaults to the first page of the default size', () => {
    should(readPageParams(undefined, undefined)).deepEqual({
      page: 1,
      size: PAGE_SIZE_DEFAULT,
      skip: 0,
    });
  });

  it('reads query-string values', () => {
    should(readPageParams('3', '20')).deepEqual({
      page: 3,
      size: 20,
      skip: 40,
    });
  });

  it('accepts the maximum size', () => {
    should(readPageParams(1, PAGE_SIZE_MAX)).match({ size: PAGE_SIZE_MAX });
  });

  [
    ['page 0', '0', undefined],
    ['a negative page', '-1', undefined],
    ['a decimal page', '1.5', undefined],
    ['a non-numeric page', 'abc', undefined],
    ['an empty page', '', undefined],
    ['size 0', undefined, '0'],
    ['a size over the maximum', undefined, String(PAGE_SIZE_MAX + 1)],
    ['a non-numeric size', undefined, 'all'],
    ['a page too large to offset', String(Number.MAX_SAFE_INTEGER), '100'],
  ].forEach(([name, page, size]) => {
    it(`rejects ${name}`, () => {
      should(readPageParams(page, size))
        .have.property('error')
        .which.is.a.String();
    });
  });
});
