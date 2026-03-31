/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  getConvertedDataFromClientRequest,
} = require('../../../api/services/EntranceService');

// Feature: entrance-boolean-characteristics
// Property 3: String-to-bool coercion round-trip
// For each of the nine characteristic fields and string representations
// 'true'/'false', getConvertedDataFromClientRequest coerces to the correct
// boolean value.

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
 * Build a mock Sails request object.
 * req.param(field) returns from body, matching Sails behaviour.
 */
function mockReq(body) {
  return {
    body,
    token: { id: 1 },
    param(field) {
      return this.body[field];
    },
  };
}

/**
 * Property 3: String-to-bool coercion round-trip
 * Encodes: for any of the nine boolean fields, when the request body contains
 * a string 'true' or 'false', getConvertedDataFromClientRequest coerces it to
 * the corresponding boolean value.
 * Covers: all nine fields with both string representations.
 *
 * Validates: Requirements 5.1, 5.2
 */
describe('EntranceBooleanCoercion - Property 3: String-to-bool coercion round-trip', () => {
  it('should coerce string booleans to actual booleans for all nine fields', function () {
    this.timeout(10000);

    const fieldArb = fc.constantFrom(...BOOLEAN_FIELDS);
    const stringBoolArb = fc.constantFrom('true', 'false');

    fc.assert(
      fc.property(fieldArb, stringBoolArb, (field, strValue) => {
        const body = { [field]: strValue };
        const req = mockReq(body);
        const result = getConvertedDataFromClientRequest(req);

        const expected = strValue === 'true';
        should(result[field]).equal(
          expected,
          `${field} with '${strValue}' should coerce to ${expected} but got ${result[field]}`
        );
        should(result[field]).be.a.Boolean();
      }),
      { numRuns: 100 }
    );
  });

  it('should return undefined for fields not present in the request', function () {
    this.timeout(10000);

    const fieldArb = fc.constantFrom(...BOOLEAN_FIELDS);

    fc.assert(
      fc.property(fieldArb, (field) => {
        const body = {};
        const req = mockReq(body);
        const result = getConvertedDataFromClientRequest(req);

        should(result[field]).be.undefined();
      }),
      { numRuns: 100 }
    );
  });
});
