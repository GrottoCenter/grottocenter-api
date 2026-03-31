/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const { toEntrance } = require('../../../api/services/mapping/converters');

// Feature: entrance-boolean-characteristics
// Property 2: Converter preserves all boolean characteristics
// For any entrance source object containing random boolean values for the nine
// characteristic fields, calling toEntrance(source) produces a result object
// where each of the nine fields equals the corresponding source value.

const BOOLEAN_FIELDS = [
  'hasBat',
  'dangerFlooding',
  'dangerCo2',
  'dangerRockfall',
  'dangerPollution',
  'needCleanGear',
  'needStayOnTrail',
  'hasRules',
  'isTouristic',
];

/**
 * Property 2: Converter preserves all boolean characteristics
 * Encodes: toEntrance copies each boolean characteristic from source to result
 * without modification.
 * Covers: all nine fields with random boolean values.
 *
 * Validates: Requirements 4.2
 */
describe('EntranceBooleanConverters - Property 2: Converter preserves all boolean characteristics', () => {
  it('should preserve all nine boolean fields from source to result', function () {
    this.timeout(10000);

    const boolFieldsArb = fc.record(
      Object.fromEntries(BOOLEAN_FIELDS.map((f) => [f, fc.boolean()]))
    );

    fc.assert(
      fc.property(boolFieldsArb, (boolValues) => {
        const source = {
          id: 1,
          isSensitive: false,
          ...boolValues,
        };

        const result = toEntrance(source);

        BOOLEAN_FIELDS.forEach((field) => {
          should(result[field]).equal(
            boolValues[field],
            `${field} should be ${boolValues[field]} but got ${result[field]}`
          );
        });
      }),
      { numRuns: 100 }
    );
  });
});
