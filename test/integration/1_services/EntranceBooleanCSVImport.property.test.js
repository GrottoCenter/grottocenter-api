/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');

// Feature: entrance-boolean-characteristics
// Property 5: CSV import parses boolean characteristic fields
// For each of the nine fields and case variations of "true"/"false",
// getConvertedEntranceFromCsv parses to the correct boolean; omitted fields
// default to false.

const BOOLEAN_FIELDS = [
  { camel: 'hasBat', csv: 'karstlink:hasBat' },
  { camel: 'dangerFlooding', csv: 'karstlink:dangerFlooding' },
  { camel: 'dangerCo2', csv: 'karstlink:dangerCo2' },
  { camel: 'dangerRockfall', csv: 'karstlink:dangerRockfall' },
  { camel: 'dangerPollution', csv: 'karstlink:dangerPollution' },
  { camel: 'needCleanGear', csv: 'karstlink:needCleanGear' },
  { camel: 'needStayOnTrail', csv: 'karstlink:needStayOnTrail' },
  { camel: 'hasRules', csv: 'karstlink:hasRules' },
  { camel: 'isTouristic', csv: 'karstlink:isTouristic' },
];

/**
 * Property 5: CSV import parses boolean characteristic fields
 * Encodes: getConvertedEntranceFromCsv correctly parses case-insensitive
 * "true"/"false" strings for all nine boolean fields, and defaults omitted
 * fields to false.
 * Covers: all nine fields with case variations and omission.
 *
 * Validates: Requirements 8.1, 8.2
 */
describe('EntranceBooleanCSVImport - Property 5: CSV import parses boolean characteristic fields', () => {
  // Lazy-load after Sails is lifted
  let getConvertedEntranceFromCsv;

  before(() => {
    /* eslint-disable global-require, prefer-destructuring */
    getConvertedEntranceFromCsv =
      require('../../../api/services/EntranceCSVImportService').getConvertedEntranceFromCsv;
    /* eslint-enable global-require, prefer-destructuring */
  });

  it('should parse case-insensitive true/false strings to correct booleans', function () {
    this.timeout(10000);

    const fieldArb = fc.constantFrom(...BOOLEAN_FIELDS);
    const caseVariantArb = fc.constantFrom(
      'true',
      'True',
      'TRUE',
      'false',
      'False',
      'FALSE'
    );

    fc.assert(
      fc.property(fieldArb, caseVariantArb, (field, strValue) => {
        const rawData = { [field.csv]: strValue };
        const cave = { id: 1, latitude: 45.0, longitude: 6.0 };
        const result = getConvertedEntranceFromCsv(rawData, 1, cave);

        const expected = strValue.toLowerCase() === 'true';
        should(result[field.camel]).equal(
          expected,
          `${field.camel} with '${strValue}' should be ${expected} but got ${result[field.camel]}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should default omitted fields to false', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(fc.constant(null), () => {
        const rawData = {};
        const cave = { id: 1, latitude: 45.0, longitude: 6.0 };
        const result = getConvertedEntranceFromCsv(rawData, 1, cave);

        BOOLEAN_FIELDS.forEach(({ camel }) => {
          should(result[camel]).equal(
            false,
            `${camel} should default to false when omitted but got ${result[camel]}`
          );
        });
      }),
      { numRuns: 10 }
    );
  });
});
