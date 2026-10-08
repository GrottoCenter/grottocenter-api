const should = require('should');
const fc = require('fast-check');
const parseBool = require('../../../api/utils/parseBool');

const ACCEPTED_STRINGS = ['true', 'false', '1', '0', ''];

describe('parseBool - Property: every accepted encoding round-trips', () => {
  // Encodes the accepted wire formats: a JSON boolean, its string form, and
  // the '1'/'0' form the web client sends.
  it('should recover the boolean from each of its encodings', () => {
    fc.assert(
      fc.property(fc.boolean(), (b) => {
        should(parseBool(b)).equal(b);
        should(parseBool(String(b))).equal(b);
        should(parseBool(b ? '1' : '0')).equal(b);
      }),
      { numRuns: 20 }
    );
  });
});

describe('parseBool - Property: any other string is invalid', () => {
  // The strictness decision: no case folding, trimming or "yes"/"on".
  // Layered from near-misses of the accepted strings to arbitrary Unicode.
  const nearMiss = fc.oneof(
    fc.constantFrom('true', 'false').chain((s) => fc.mixedCase(fc.constant(s))),
    fc
      .tuple(
        fc.constantFrom(...ACCEPTED_STRINGS),
        fc.constantFrom(' ', '\t', '\n', '\u00a0', '\0')
      )
      .chain(([s, pad]) => fc.constantFrom(`${pad}${s}`, `${s}${pad}`)),
    fc.integer().map(String)
  );
  const anyString = fc.oneof(
    { weight: 3, arbitrary: nearMiss },
    { weight: 2, arbitrary: fc.string() },
    { weight: 1, arbitrary: fc.string({ unit: 'grapheme' }) }
  );

  it('should return INVALID for every string outside the accepted set', () => {
    fc.assert(
      fc.property(
        anyString.filter((s) => !ACCEPTED_STRINGS.includes(s)),
        (s) => {
          should(parseBool(s)).equal(parseBool.INVALID);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('parseBool - Property: non-string, non-boolean values are invalid', () => {
  // A JSON body can carry numbers, arrays and objects; none is coerced.
  it('should return INVALID for numbers, arrays and objects', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double(),
          fc.integer(),
          fc.array(fc.anything()),
          fc.object()
        ),
        (value) => {
          should(parseBool(value)).equal(parseBool.INVALID);
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('parseBool - Property: the result is always one of four outcomes', () => {
  it('should return true, false, undefined or INVALID for any input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        should([true, false, undefined, parseBool.INVALID]).containEql(
          parseBool(value)
        );
      }),
      { numRuns: 500 }
    );
  });
});
