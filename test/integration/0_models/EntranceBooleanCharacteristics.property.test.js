const should = require('should');
const fc = require('fast-check');

// Feature: entrance-boolean-characteristics
// Property 1: Model attribute consistency
// For each of the nine boolean characteristic field names, both TEntrance and
// HEntrance Waterline model definitions declare an attribute with
// type: 'boolean', allowNull: false, defaultsTo: false, and the correct
// snake_case columnName.

const TEntranceDef = require('../../../api/models/TEntrance');
const HEntranceDef = require('../../../api/models/HEntrance');

const BOOLEAN_FIELDS = [
  { camel: 'hasBat', column: 'has_bat' },
  { camel: 'dangerFlooding', column: 'danger_flooding' },
  { camel: 'dangerCo2', column: 'danger_co2' },
  { camel: 'dangerRockfall', column: 'danger_rockfall' },
  { camel: 'dangerPollution', column: 'danger_pollution' },
  { camel: 'needCleanGear', column: 'need_clean_gear' },
  { camel: 'needStayOnTrail', column: 'need_stay_on_trail' },
  { camel: 'hasRules', column: 'has_rules' },
  { camel: 'isTouristic', column: 'is_touristic' },
];

/**
 * Property 1: Model attribute consistency
 * Encodes: every boolean characteristic field is declared identically in both
 * TEntrance and HEntrance with the correct type, nullability, default, and
 * column mapping.
 * Covers: all nine fields across both models.
 *
 * Validates: Requirements 2.1, 3.1
 */
describe('EntranceBooleanCharacteristics - Property 1: Model attribute consistency', () => {
  it('should declare consistent boolean attributes for any subset of the nine fields', function () {
    this.timeout(10000);
    fc.assert(
      fc.property(fc.subarray(BOOLEAN_FIELDS, { minLength: 1 }), (subset) => {
        subset.forEach(({ camel, column }) => {
          [TEntranceDef, HEntranceDef].forEach((model) => {
            const attr = model.attributes[camel];
            should.exist(attr, `${model.tableName} missing attribute ${camel}`);
            should(attr.type).eql('boolean');
            should(attr.allowNull).eql(false);
            should(attr.defaultsTo).eql(false);
            should(attr.columnName).eql(column);
          });
        });
      }),
      { numRuns: 100 }
    );
  });
});
