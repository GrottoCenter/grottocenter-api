const should = require('should');
const parsePdfPageOffset = require('../../../api/utils/parsePdfPageOffset');

const { INVALID, MAX } = parsePdfPageOffset;

describe('parsePdfPageOffset - Unit Tests', () => {
  it('should treat undefined as absent', () => {
    should(parsePdfPageOffset(undefined)).be.undefined();
  });

  it('should treat null and the empty string as an explicit clear', () => {
    should(parsePdfPageOffset(null)).be.null();
    should(parsePdfPageOffset('')).be.null();
  });

  it('should keep zero as a configured offset', () => {
    should(parsePdfPageOffset(0)).equal(0);
    should(parsePdfPageOffset('0')).equal(0);
    should(Object.is(parsePdfPageOffset('-0'), 0)).be.true();
    should(Object.is(parsePdfPageOffset(-0), 0)).be.true();
  });

  it('should accept positive and negative integers', () => {
    should(parsePdfPageOffset(1)).equal(1);
    should(parsePdfPageOffset(-126)).equal(-126);
  });

  it('should accept integer strings from multipart bodies', () => {
    should(parsePdfPageOffset('1')).equal(1);
    should(parsePdfPageOffset('+1')).equal(1);
    should(parsePdfPageOffset('-126')).equal(-126);
    should(parsePdfPageOffset('007')).equal(7);
  });

  it('should accept the bounds', () => {
    should(parsePdfPageOffset(MAX)).equal(2147483647);
    should(parsePdfPageOffset(-MAX)).equal(-2147483647);
    should(parsePdfPageOffset('2147483647')).equal(2147483647);
    should(parsePdfPageOffset('-2147483647')).equal(-2147483647);
  });

  it('should reject values out of range', () => {
    should(parsePdfPageOffset(2147483648)).equal(INVALID);
    should(parsePdfPageOffset(-2147483648)).equal(INVALID);
    should(parsePdfPageOffset('2147483648')).equal(INVALID);
    should(parsePdfPageOffset('99999999999999999999')).equal(INVALID);
  });

  it('should reject fractions and non-integer notations', () => {
    should(parsePdfPageOffset(1.5)).equal(INVALID);
    should(parsePdfPageOffset('1.5')).equal(INVALID);
    should(parsePdfPageOffset('1.0')).equal(INVALID);
    should(parsePdfPageOffset('1e3')).equal(INVALID);
    should(parsePdfPageOffset('0x10')).equal(INVALID);
  });

  it('should reject malformed values', () => {
    should(parsePdfPageOffset('abc')).equal(INVALID);
    should(parsePdfPageOffset(' 1')).equal(INVALID);
    should(parsePdfPageOffset('1 ')).equal(INVALID);
    should(parsePdfPageOffset('+')).equal(INVALID);
    should(parsePdfPageOffset('-')).equal(INVALID);
    should(parsePdfPageOffset(NaN)).equal(INVALID);
    should(parsePdfPageOffset(Infinity)).equal(INVALID);
    should(parsePdfPageOffset(true)).equal(INVALID);
    should(parsePdfPageOffset({})).equal(INVALID);
    should(parsePdfPageOffset([1])).equal(INVALID);
  });
});
