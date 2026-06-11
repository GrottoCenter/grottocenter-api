const should = require('should');
const fc = require('fast-check');
const isBlank = require('../../../api/utils/isBlank');
const isNonBlankString = require('../../../api/utils/isNonBlankString');

describe('isBlank - Property: complement of isNonBlankString for strings', () => {
  it('should return true for any string where isNonBlankString returns false', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        should(isBlank(s)).equal(!isNonBlankString(s));
      }),
      { numRuns: 200 }
    );
  });
});

describe('isBlank - Property: always true for nullish values', () => {
  it('should return true for undefined and null', () => {
    fc.assert(
      fc.property(fc.constantFrom(undefined, null), (val) => {
        should(isBlank(val)).be.true();
      }),
      { numRuns: 10 }
    );
  });
});

describe('isBlank - Property: whitespace-only strings are blank', () => {
  it('should return true for strings composed entirely of whitespace', () => {
    const whitespaceArb = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), {
        minLength: 0,
        maxLength: 50,
      })
      .map((chars) => chars.join(''));

    fc.assert(
      fc.property(whitespaceArb, (s) => {
        should(isBlank(s)).be.true();
      }),
      { numRuns: 200 }
    );
  });
});

describe('isBlank - Property: non-string truthy values are never blank', () => {
  it('should return false for numbers, objects, arrays, and booleans', () => {
    const nonStringArb = fc.oneof(
      fc.integer(),
      fc.double({ noNaN: true }),
      fc.boolean(),
      fc.object(),
      fc.array(fc.anything())
    );

    fc.assert(
      fc.property(nonStringArb, (val) => {
        should(isBlank(val)).be.false();
      }),
      { numRuns: 200 }
    );
  });
});

describe('isNonBlankString - Property: true iff string with at least one non-whitespace char', () => {
  it('should return true for any string containing a visible character', () => {
    // Generate strings guaranteed to have at least one non-whitespace character
    const visibleCharArb = fc
      .tuple(
        fc.string(), // prefix (may be whitespace)
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), // at least one visible char
        fc.string() // suffix (may be whitespace)
      )
      .map(([pre, visible, suf]) => `${pre}${visible}${suf}`);

    fc.assert(
      fc.property(visibleCharArb, (s) => {
        should(isNonBlankString(s)).be.true();
      }),
      { numRuns: 200 }
    );
  });

  it('should return false for non-string values', () => {
    const nonStringArb = fc.oneof(
      fc.constant(undefined),
      fc.constant(null),
      fc.integer(),
      fc.boolean(),
      fc.object()
    );

    fc.assert(
      fc.property(nonStringArb, (val) => {
        should(isNonBlankString(val)).be.false();
      }),
      { numRuns: 100 }
    );
  });
});

describe('isBlank / isNonBlankString - Property: mutual exclusion for strings', () => {
  it('should never have both return true for the same string', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const blank = isBlank(s);
        const nonBlank = isNonBlankString(s);
        // Exactly one must be true for any string
        should(blank !== nonBlank).be.true();
      }),
      { numRuns: 200 }
    );
  });
});
