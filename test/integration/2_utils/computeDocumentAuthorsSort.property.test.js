/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  AUTHORED_SORT_KEY_PREFIX,
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
} = require('../../../api/utils/computeDocumentAuthorsSort');

/**
 * Arbitrary: a plausible author name. Deliberately spans the whole range a
 * document can actually hold - Latin with diacritics, Cyrillic, Greek, CJK,
 * RTL scripts, astral-plane characters - rather than a curated below-"~"
 * alphabet. The ordering property must hold for every script we index, not
 * just the ones that happen to normalize into ASCII.
 */
const nameArb = fc.oneof(
  fc.string({
    unit: fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -'.éÉèÀçÇüÖñÞßœ".split(
        ''
      )
    ),
    maxLength: 15,
  }),
  fc.string({
    // Iterate by code point, not by `.split('')`: the astral-plane samples
    // below (U+2000B, U+2A600) are two UTF-16 code units each, so splitting by
    // code unit would offer their surrogate halves as standalone units and
    // generate names holding lone surrogates. Those have no UTF-8 encoding —
    // every one of them serializes to U+FFFD — which collapses names this
    // helper orders as distinct and makes Property 4 fail on ~9% of seeds.
    unit: fc.constantFrom(
      ...'ЯрославльΩμέγα山田太郎홍길동محمدמשהสมชาย𠀋𪘀',
      '\u{10FFFD}',
      '�',
      '~'
    ),
    maxLength: 15,
  }),
  fc.string({ unit: 'grapheme', maxLength: 15 }),
  fc.string({ unit: 'binary', maxLength: 15 })
);

/** Arbitrary: a list of names, possibly holding blanks and null/undefined. */
const namesArb = fc.array(fc.oneof(nameArb, fc.constantFrom(null, undefined)), {
  maxLength: 5,
});

/**
 * Arbitrary: a list holding at least one name that survives normalization.
 *
 * Survival is decided by asking the helper itself, not by `.trim()`: `trim`
 * only strips whitespace, while normalizeName strips combining marks first, so
 * a name made purely of diacritics is non-blank to `trim` yet normalizes away.
 * U+1FDD, say, decomposes under NFKD to a space plus two combining marks and
 * leaves nothing behind — a `trim`-based precondition would hand such a name to
 * the properties below as "authored" and they would rightly disagree.
 */
const nonEmptyNamesArb = namesArb.filter(
  (names) => computeDocumentAuthorsSort(names) !== EMPTY_AUTHORS_SORT_KEY
);

/** Strip the ordering bucket prefix to recover the normalized name. */
const nameOf = (key) => key.slice(AUTHORED_SORT_KEY_PREFIX.length);

describe('computeDocumentAuthorsSort - Property Tests', () => {
  /**
   * Property 1: Normalization idempotency
   *
   * The name inside a sort key is already normalized, so re-keying it must
   * yield the same name back. Catches normalizeName regressions (diacritic
   * stripping, lowercasing, whitespace collapsing) that would make the key
   * unstable across re-indexations.
   */
  describe('Property 1: Normalization idempotency', () => {
    it('should renormalize its own output to the same name', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(nonEmptyNamesArb, nonEmptyNamesArb, (persons, orgs) => {
          const key = computeDocumentAuthorsSort(persons, orgs);
          const name = nameOf(key);
          should(computeDocumentAuthorsSort([name])).equal(key);
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property 2: Authorless ordering
   *
   * Any document with at least one usable author must sort before authorless
   * documents on ascending order — in *both* orderings that matter: UTF-16
   * code units (JS string compare) and UTF-8 bytes (what Typesense compares).
   * Names span every script we index, so this also pins that no legitimate
   * name can overtake the authorless key.
   */
  describe('Property 2: Authorless ordering', () => {
    it('should produce a key below the authorless key whenever an author exists', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(nonEmptyNamesArb, (names) => {
          const key = computeDocumentAuthorsSort(names);
          should(key).not.equal(EMPTY_AUTHORS_SORT_KEY);
          // UTF-16 code-unit order (JS).
          should(key < EMPTY_AUTHORS_SORT_KEY).be.true();
          // UTF-8 byte order (Typesense).
          should(
            Buffer.compare(
              Buffer.from(key, 'utf8'),
              Buffer.from(EMPTY_AUTHORS_SORT_KEY, 'utf8')
            )
          ).equal(-1);
        }),
        { numRuns: 300 }
      );
    });

    it('should return the authorless key when no name survives normalization', function () {
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

  /**
   * Property 4: Minimality under UTF-8 byte order
   *
   * The key must hold the name Typesense itself would rank first, so the name
   * we pick has to be the minimum under UTF-8 byte order — not under JS's
   * UTF-16 code-unit order, which disagrees for astral-plane characters.
   */
  describe('Property 4: Minimality under UTF-8 byte order', () => {
    it('should select the byte-order-smallest surviving name', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(nonEmptyNamesArb, nonEmptyNamesArb, (persons, orgs) => {
          const chosen = Buffer.from(
            nameOf(computeDocumentAuthorsSort(persons, orgs)),
            'utf8'
          );
          const candidates = [...persons, ...orgs]
            .filter((n) => n != null)
            .map((n) => nameOf(computeDocumentAuthorsSort([n])))
            .filter((n) => n.length > 0);
          for (const candidate of candidates) {
            should(
              Buffer.compare(chosen, Buffer.from(candidate, 'utf8'))
            ).be.belowOrEqual(0);
          }
        }),
        { numRuns: 200 }
      );
    });
  });
});
