const should = require('should');
const fc = require('fast-check');
const {
  MAX_PDF_PAGE_OFFSET,
  parsePdfPageOffset,
} = require('../../../api/utils/pdfPageOffset');

describe('parsePdfPageOffset - Property: in-range integers round-trip', () => {
  // Any offset in the symmetric int4 range, sent as a JSON number or as the
  // decimal string a multipart body carries, parses back to itself.
  it('should return the same integer from a number or its string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -MAX_PDF_PAGE_OFFSET, max: MAX_PDF_PAGE_OFFSET }),
        (offset) => {
          should(parsePdfPageOffset(offset, 'f')).deepEqual({ value: offset });
          should(parsePdfPageOffset(String(offset), 'f')).deepEqual({
            value: offset,
          });
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('parsePdfPageOffset - Property: out-of-range integers are rejected', () => {
  it('should return an error beyond either bound', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 2147483648n, max: 2n ** 70n }),
        fc.boolean(),
        (magnitude, negative) => {
          const input = `${negative ? '-' : ''}${magnitude}`;
          should(parsePdfPageOffset(input, 'f')).have.property('error');
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('parsePdfPageOffset - Property: non-integer numbers are rejected', () => {
  it('should return an error for any finite number with a fractional part', () => {
    fc.assert(
      fc.property(
        fc
          .double({ min: -1e6, max: 1e6, noNaN: true })
          .filter((n) => !Number.isInteger(n)),
        (n) => {
          should(parsePdfPageOffset(n, 'f')).have.property('error');
          should(parsePdfPageOffset(String(n), 'f')).have.property('error');
        }
      ),
      { numRuns: 300 }
    );
  });
});
