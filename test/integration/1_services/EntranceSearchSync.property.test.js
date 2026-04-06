/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const { computeDateLastModif } = require('../../../config/constants/entrance');

// Feature: advanced-search-entrance-sorting
// Property 1: computeDateLastModif returns the most recent date
// For any dateInscription (positive integer) and for any dateReviewed
// (positive integer or null), computeDateLastModif returns the greater of
// the two, falling back to dateInscription when dateReviewed is nullish.

/**
 * Property 1: computeDateLastModif returns the most recent date
 * Encodes: the result always equals Math.max(dateInscription, dateReviewed ?? dateInscription).
 * Covers: all combinations of present and absent dateReviewed values.
 *
 * Validates: Requirements 2.2, 2.3
 */
describe('EntranceSearchSync - Property 1: computeDateLastModif returns the most recent date', () => {
  it('should return Math.max(dateInscription, dateReviewed ?? dateInscription)', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(
        fc.nat(),
        fc.option(fc.nat()),
        (dateInscription, dateReviewed) => {
          const result = computeDateLastModif(dateInscription, dateReviewed);
          const expected = Math.max(
            dateInscription,
            dateReviewed ?? dateInscription
          );
          should(result).equal(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

const {
  search: { importFormater },
} = require('../../../api/dbSync/entities/entrance');
const { toEntrance } = require('../../../api/services/mapping/converters');

// Property 2: Sync path consistency — numericId and dateLastModif
// For any entrance with a numeric id, a dateInscription timestamp, and an
// optional dateReviewed timestamp, the numericId and dateLastModif values
// produced by importFormater SHALL equal those produced by the updateInSearch
// document construction, given the same input data.

/**
 * Property 2: Sync path consistency — numericId and dateLastModif
 * Encodes: both sync paths produce identical numericId and dateLastModif
 * for the same entrance data.
 * Covers: random positive int id, random dateInscription (Date), optional dateReviewed (Date).
 *
 * Validates: Requirements 1.2, 1.4, 4.1, 4.2
 */
describe('EntranceSearchSync - Property 2: Sync path consistency for numericId and dateLastModif', () => {
  it('should produce identical numericId and dateLastModif across both sync paths', function () {
    this.timeout(10000);

    const entranceArb = fc.record({
      id: fc.integer({ min: 1, max: 2147483647 }),
      dateInscription: fc.integer({ min: 86400000, max: 4102444800000 }),
      dateReviewed: fc.option(
        fc.integer({ min: 86400000, max: 4102444800000 }),
        { nil: null }
      ),
    });

    fc.assert(
      fc.property(entranceArb, ({ id, dateInscription, dateReviewed }) => {
        // --- importFormater path ---
        const dbRow = {
          id,
          dateInscription: new Date(dateInscription),
          dateReviewed: dateReviewed ? new Date(dateReviewed) : null,
          // Minimal fields to avoid errors in importFormater
          isSensitive: false,
          comments: [],
        };
        const formatted = importFormater(dbRow);

        // --- simulated updateInSearch path ---
        const uisNumericId = id;
        const uisDateLastModif = computeDateLastModif(
          dateInscription,
          dateReviewed
        );

        should(formatted.numericId).equal(
          uisNumericId,
          `numericId mismatch: importFormater=${formatted.numericId}, updateInSearch=${uisNumericId}`
        );
        should(formatted.dateLastModif).equal(
          uisDateLastModif,
          `dateLastModif mismatch: importFormater=${formatted.dateLastModif}, updateInSearch=${uisDateLastModif}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Property 3: toEntrance preserves dateLastModif
// For any source object containing a dateLastModif value, calling
// toEntrance(source) SHALL produce a result where result.dateLastModif
// equals source.dateLastModif.

/**
 * Property 3: toEntrance preserves dateLastModif
 * Encodes: the converter passes dateLastModif through without modification.
 * Covers: random dateLastModif values (non-negative integers).
 *
 * Validates: Requirements 2.5
 */
describe('EntranceSearchSync - Property 3: toEntrance preserves dateLastModif', () => {
  it('should preserve dateLastModif from source to result', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(fc.nat(), (dateLastModif) => {
        const source = {
          id: 1,
          isSensitive: false,
          dateLastModif,
        };

        const result = toEntrance(source);

        should(result.dateLastModif).equal(
          dateLastModif,
          `dateLastModif should be ${dateLastModif} but got ${result.dateLastModif}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Schema smoke tests for numericId and dateLastModif fields
const {
  search: { schema: entranceSchema },
} = require('../../../api/dbSync/entities/entrance');
const EntranceModel = require('../../../api/services/mapping/models/EntranceModel');

describe('EntranceSearchSync - Schema smoke tests', () => {
  it('should have numericId field with type int32 and sort true', () => {
    const field = entranceSchema.fields.find((f) => f.name === 'numericId');
    should(field).not.be.undefined();
    should(field.type).equal('int32');
    should(field.sort).equal(true);
  });

  it('should have dateLastModif field with type int64, sort true, and optional true', () => {
    const field = entranceSchema.fields.find((f) => f.name === 'dateLastModif');
    should(field).not.be.undefined();
    should(field.type).equal('int64');
    should(field.sort).equal(true);
    should(field.optional).equal(true);
  });

  it('should keep default_sorting_field as dateInscription', () => {
    should(entranceSchema.default_sorting_field).equal('dateInscription');
  });

  it('should have dateLastModif property in EntranceModel', () => {
    should(EntranceModel).have.property('dateLastModif');
  });
});
