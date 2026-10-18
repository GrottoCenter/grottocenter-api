const should = require('should');
const fc = require('fast-check');
const parseImportId = require('../../../api/utils/parseImportId');

const { MAX_PG_INTEGER, MAX_PG_BIGINT } = parseImportId;
const BOUNDS = [MAX_PG_INTEGER, MAX_PG_BIGINT];

describe('parseImportId - Property: in-range digit strings round-trip', () => {
  // Any id in [0, max], written with optional leading zeros, parses back to
  // its canonical decimal form.
  it('should return the canonical decimal string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BOUNDS),
        fc.bigInt({ min: 0n, max: MAX_PG_BIGINT }),
        fc.nat({ max: 3 }),
        (max, n, zeros) => {
          const id = n % (max + 1n);
          const input = `${'0'.repeat(zeros)}${id}`;
          should(parseImportId(input, max)).equal(id.toString());
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('parseImportId - Property: ids above the column bound are rejected', () => {
  it('should return null for any id greater than max', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BOUNDS),
        fc.bigInt({ min: 1n, max: 10n ** 30n }),
        (max, excess) => {
          should(parseImportId((max + excess).toString(), max)).be.null();
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('parseImportId - Property: strings with a non-digit character are rejected', () => {
  it('should return null when any non-digit sits among digits', () => {
    const nonDigit = fc
      .string({ minLength: 1, maxLength: 1, unit: 'binary' })
      .filter((c) => !/\d/.test(c));
    fc.assert(
      fc.property(
        fc.stringMatching(/^\d{0,10}$/),
        nonDigit,
        fc.stringMatching(/^\d{0,10}$/),
        (before, c, after) => {
          should(
            parseImportId(`${before}${c}${after}`, MAX_PG_BIGINT)
          ).be.null();
        }
      ),
      { numRuns: 300 }
    );
  });
});
