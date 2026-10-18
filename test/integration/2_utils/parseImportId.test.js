const should = require('should');
const parseImportId = require('../../../api/utils/parseImportId');

const { MAX_PG_INTEGER, MAX_PG_BIGINT } = parseImportId;

describe('parseImportId', () => {
  it('should return the id of a digit string', () => {
    should(parseImportId('123', MAX_PG_INTEGER)).equal('123');
  });

  it('should accept a JS integer', () => {
    should(parseImportId(123, MAX_PG_INTEGER)).equal('123');
  });

  it('should strip leading zeros', () => {
    should(parseImportId('00042', MAX_PG_INTEGER)).equal('42');
  });

  it('should accept an 11-digit Georisques id within bigint range', () => {
    should(parseImportId('10000000001', MAX_PG_BIGINT)).equal('10000000001');
  });

  it('should reject an 11-digit id within integer range', () => {
    should(parseImportId('10000000001', MAX_PG_INTEGER)).be.null();
  });

  it('should accept the bounds of each column', () => {
    should(parseImportId('2147483647', MAX_PG_INTEGER)).equal('2147483647');
    should(parseImportId('9223372036854775807', MAX_PG_BIGINT)).equal(
      '9223372036854775807'
    );
  });

  it('should reject values just above each bound', () => {
    should(parseImportId('2147483648', MAX_PG_INTEGER)).be.null();
    should(parseImportId('9223372036854775808', MAX_PG_BIGINT)).be.null();
  });

  [
    ['an empty string', ''],
    ['a blank string', '   '],
    ['a padded id', ' 42 '],
    ['a negative number', '-1'],
    ['a signed number', '+1'],
    ['a decimal', '12.5'],
    ['an exponent', '1e10'],
    ['a non-numeric string', 'abc'],
    ['a negative JS number', -1],
    ['a JS float', 1.5],
    ['an unsafe JS integer', 2 ** 53],
    ['NaN', NaN],
    ['null', null],
    ['undefined', undefined],
    ['an object', { id: 1 }],
  ].forEach(([label, value]) => {
    it(`should reject ${label}`, () => {
      should(parseImportId(value, MAX_PG_BIGINT)).be.null();
    });
  });

  it('should name the value and the bound in the error message', () => {
    should(
      parseImportId.invalidImportIdMessage('10000000001', MAX_PG_INTEGER)
    ).equal(
      'Invalid id "10000000001": expected an integer between 0 and 2147483647.'
    );
  });
});
