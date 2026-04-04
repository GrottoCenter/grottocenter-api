/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const { getMainLanguage } = require('../../../api/services/mapping/utils');
const {
  toSimpleCave,
  toOrganization,
  toDocument,
  toSimpleOrganization,
} = require('../../../api/services/mapping/converters');

// --- Shared arbitraries ---

// ISO 639-3-like codes: 3 lowercase letters
const lowerAlpha = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz');
const iso639Arb = fc
  .tuple(lowerAlpha, lowerAlpha, lowerAlpha)
  .map(([a, b, c]) => a + b + c);

// Unix timestamp in milliseconds (realistic range: 2020–2030)
const timestampArb = fc.integer({ min: 1577836800000, max: 1893456000000 });

/**
 * Property 1: Bug Condition — Search Language Field Returns Null
 * for Typesense Hit Documents
 *
 * When the source object has a flat `language` string (Typesense shape)
 * and no `names` Array (database shape), the converters should return
 * the language string — not null/undefined/missing.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 */
describe('SearchLanguageField - Property 1: Bug Condition', () => {
  it('1a: getMainLanguage returns the language from a flat Typesense source', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(iso639Arb, (lang) => {
        const result = getMainLanguage({ language: lang });
        should(result).equal(lang);
      }),
      { numRuns: 100 }
    );
  });

  it('1b: toSimpleCave returns the language from a flat Typesense source', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(iso639Arb, (lang) => {
        const result = toSimpleCave({ id: '1', name: 'Cave', language: lang });
        should(result.language).equal(lang);
      }),
      { numRuns: 100 }
    );
  });

  it('1c: toOrganization returns the language from a flat Typesense source', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(iso639Arb, timestampArb, (lang, ts) => {
        const result = toOrganization({
          id: '1',
          name: 'Org',
          language: lang,
          dateInscription: ts,
        });
        should(result.language).equal(lang);
      }),
      { numRuns: 100 }
    );
  });

  it('1d: toDocument returns the language from a flat Typesense source', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(iso639Arb, timestampArb, (lang, ts) => {
        const result = toDocument({
          id: '1',
          title: 'Doc',
          language: lang,
          dateInscription: ts,
        });
        should(result.language).equal(lang);
      }),
      { numRuns: 100 }
    );
  });

  it('1e: toSimpleOrganization returns the language from a flat Typesense source', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(iso639Arb, (lang) => {
        const result = toSimpleOrganization({
          id: '1',
          name: 'Org',
          language: lang,
        });
        should(result.language).equal(lang);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Preservation — Database Sources Continue Deriving
 * Language from Names Array
 *
 * When the source object has a `names` Array (database shape), the
 * converters must continue to derive language from the main name entry.
 * These tests capture baseline behavior on UNFIXED code so we can
 * verify the fix does not regress the database path.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
describe('SearchLanguageField - Property 2: Preservation', () => {
  // Arbitrary: random names arrays with varying structures
  const namesArb = fc.array(
    fc.record({
      name: fc.string(),
      isMain: fc.boolean(),
      language: iso639Arb,
      id: fc.nat(),
    })
  );

  /**
   * 2a: getMainLanguage preservation
   *
   * Constrains: For all source objects where source.names IS an Array,
   * getMainLanguage returns the language of the first entry with
   * isMain === true, or null if no such entry exists.
   *
   * Covers: empty arrays, arrays with no main name, arrays with one
   * or more main names (first match wins via Array.find).
   */
  it('2a: getMainLanguage derives language from names Array', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(namesArb, (names) => {
        const source = { names };
        const result = getMainLanguage(source);
        const expected = names.find((n) => n.isMain)?.language ?? null;
        should(result).equal(expected);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2b: toOrganization preservation
   *
   * Constrains: For all source objects where source.names IS an Array,
   * toOrganization derives language and nameId from the main name entry
   * in the Array, matching the inline Array.isArray derivation.
   *
   * Covers: organizations with database-shaped names arrays.
   */
  it('2b: toOrganization derives language and nameId from names Array', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(namesArb, timestampArb, (names, ts) => {
        const source = {
          id: 1,
          names,
          dateInscription: ts,
        };
        const result = toOrganization(source);
        const mainEntry = names.find((n) => n.isMain);
        const expectedLanguage = mainEntry?.language;
        const expectedNameId = mainEntry?.id;
        should(result.language).equal(expectedLanguage);
        should(result.nameId).equal(expectedNameId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2c: toDocument preservation
   *
   * Constrains: For all document source objects with database shape
   * (having a mainLanguage object with an id, and a languages array
   * of objects with ids), the output mainLanguage and languages fields
   * are unchanged — mainLanguage maps to source.mainLanguage.id and
   * languages maps to source.languages.map(e => e.id).
   *
   * Covers: documents loaded from the database via Waterline ORM.
   */
  it('2c: toDocument preserves mainLanguage and languages from DB shape', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        iso639Arb,
        fc.array(iso639Arb, { minLength: 1, maxLength: 5 }),
        timestampArb,
        (mainLang, langIds, ts) => {
          const source = {
            id: 1,
            dateInscription: ts,
            mainLanguage: { id: mainLang },
            languages: langIds.map((lid) => ({ id: lid })),
          };
          const result = toDocument(source);
          should(result.mainLanguage).equal(mainLang);
          should(result.languages).deepEqual(langIds);
          // language is now always populated, derived from mainLanguage for DB sources
          should(result.language).equal(mainLang);
        }
      ),
      { numRuns: 100 }
    );
  });
});
