/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
} = require('../../../api/utils/computeDocumentAuthorsSort');

/**
 * Arbitrary: a plausible author name. The pool stays within the Latin range
 * the sort key targets (letters, digits, separators, accented letters) because
 * the sentinel ordering property only holds for scripts that normalize to
 * characters below "~" - a documented limitation of the utility.
 */
const nameArb = fc.string({
  unit: fc.constantFrom(
    ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -'.éÉèÀçÇüÖñ".split(
      ''
    )
  ),
  maxLength: 15,
});

/** Arbitrary: a list of names, possibly holding blanks and null/undefined. */
const namesArb = fc.array(fc.oneof(nameArb, fc.constantFrom(null, undefined)), {
  maxLength: 5,
});

/** Arbitrary: a list holding at least one name that survives normalization. */
const nonEmptyNamesArb = namesArb.filter((names) =>
  names.some((n) => typeof n === 'string' && n.trim().length > 0)
);

describe('computeDocumentAuthorsSort - Property Tests', () => {
  /**
   * Property 1: Normalization idempotency
   *
   * The sort key is already normalized, so feeding it back through the
   * utility must return it unchanged. Catches normalizeName regressions
   * (diacritic stripping, lowercasing, whitespace collapsing) that would
   * make the key unstable across re-indexations.
   */
  describe('Property 1: Normalization idempotency', () => {
    it('should return its own output unchanged when re-applied', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(namesArb, namesArb, (persons, organizations) => {
          const key = computeDocumentAuthorsSort(persons, organizations);
          should(computeDocumentAuthorsSort([key])).equal(key);
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property 2: Sentinel ordering
   *
   * Any document with at least one usable author must sort before authorless
   * documents on ascending order, i.e. its key stays strictly below the
   * sentinel.
   */
  describe('Property 2: Sentinel ordering', () => {
    it('should produce a key below the sentinel whenever an author exists', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(nonEmptyNamesArb, (names) => {
          const key = computeDocumentAuthorsSort(names);
          should(key).not.equal(EMPTY_AUTHORS_SORT_KEY);
          should(key < EMPTY_AUTHORS_SORT_KEY).be.true();
        }),
        { numRuns: 200 }
      );
    });

    it('should return the sentinel when no name survives normalization', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constantFrom(null, undefined, '', '   ', '\t\n'),
              fc.string({
                unit: fc.constantFrom(' ', '\t', '\n'),
                maxLength: 5,
              })
            ),
            { maxLength: 5 }
          ),
          (names) => {
            should(computeDocumentAuthorsSort(names)).equal(
              EMPTY_AUTHORS_SORT_KEY
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Pool commutativity
   *
   * Persons and organizations are pooled as plain strings, so the result must
   * not depend on which argument a name arrives in, nor on its position.
   */
  describe('Property 3: Pool commutativity', () => {
    it('should not depend on which pool a name belongs to', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(namesArb, namesArb, (persons, organizations) => {
          const expected = computeDocumentAuthorsSort(persons, organizations);
          should(computeDocumentAuthorsSort(organizations, persons)).equal(
            expected
          );
          should(
            computeDocumentAuthorsSort([...persons, ...organizations], [])
          ).equal(expected);
          should(
            computeDocumentAuthorsSort([], [...organizations, ...persons])
          ).equal(expected);
        }),
        { numRuns: 200 }
      );
    });

    it('should not depend on the order of names within a pool', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(namesArb, (names) => {
          should(computeDocumentAuthorsSort([...names].reverse())).equal(
            computeDocumentAuthorsSort(names)
          );
        }),
        { numRuns: 200 }
      );
    });
  });
});
