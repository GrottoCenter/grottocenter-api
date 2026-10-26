const should = require('should');
const fc = require('fast-check');
const parsePdfPageOffset = require('../../../api/utils/parsePdfPageOffset');

const { INVALID, MAX } = parsePdfPageOffset;

const inRange = fc.integer({ min: -MAX, max: MAX });
const outOfRange = fc.oneof(
  fc.integer({ min: MAX + 1, max: Number.MAX_SAFE_INTEGER }),
  fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -MAX - 1 })
);

describe('parsePdfPageOffset - Property: in-range integers round-trip', () => {
  // Covers the number form (JSON bodies) and the decimal string forms a
  // multipart body carries, with an optional sign and leading zeros.
  it('should recover the integer from its number and string encodings', () => {
    fc.assert(
      fc.property(inRange, fc.nat({ max: 3 }), (n, zeros) => {
        const expected = n === 0 ? 0 : n;
        const digits = '0'.repeat(zeros) + String(Math.abs(n));
        should(parsePdfPageOffset(n)).equal(expected);
        should(parsePdfPageOffset(String(n))).equal(expected);
        should(parsePdfPageOffset(`${n < 0 ? '-' : '+'}${digits}`)).equal(
          expected
        );
      }),
      { numRuns: 200 }
    );
  });
});

describe('parsePdfPageOffset - Property: out-of-range integers are invalid', () => {
  // The bound is checked after parsing, for both encodings.
  it('should reject integers beyond the bounds', () => {
    fc.assert(
      fc.property(outOfRange, (n) => {
        should(parsePdfPageOffset(n)).equal(INVALID);
        should(parsePdfPageOffset(String(n))).equal(INVALID);
      }),
      { numRuns: 100 }
    );
  });
});

describe('parsePdfPageOffset - Property: non-integer values are invalid', () => {
  // Fractions, and strings that are not a bare signed decimal integer:
  // whitespace padding, decimal points, exponents and arbitrary text.
  const fraction = fc
    .double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 })
    .filter((d) => !Number.isInteger(d));
  const paddedInteger = fc
    .tuple(inRange, fc.constantFrom(' ', '\t', '\n', ' '))
    .chain(([n, pad]) => fc.constantFrom(`${pad}${n}`, `${n}${pad}`));
  const decorated = inRange.chain((n) =>
    fc.constantFrom(`${n}.0`, `${n}e0`, `${n}px`, `0x${Math.abs(n)}`)
  );
  const text = fc.string().filter((s) => s !== '' && !/^[+-]?\d+$/.test(s));

  it('should reject fractions', () => {
    fc.assert(
      fc.property(fraction, (d) => {
        should(parsePdfPageOffset(d)).equal(INVALID);
        should(parsePdfPageOffset(String(d))).equal(INVALID);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings that are not a bare integer', () => {
    fc.assert(
      fc.property(fc.oneof(paddedInteger, decorated, text), (s) => {
        should(parsePdfPageOffset(s)).equal(INVALID);
      }),
      { numRuns: 200 }
    );
  });
});
