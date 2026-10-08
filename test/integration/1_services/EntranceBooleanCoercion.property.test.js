/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  BOOLEAN_FIELDS,
  getConvertedDataFromClientRequest,
} = require('../../../api/services/EntranceService');
const parseBool = require('../../../api/utils/parseBool');

// Feature: entrance-boolean-characteristics
// The converter maps each boolean field through parseBool. Rejecting an
// INVALID result with a 400 is the controller's job (readBoolParam.firstError),
// so here INVALID is the expected output for anything unrecognised.

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

const fieldArb = fc.constantFrom(...BOOLEAN_FIELDS);

/**
 * Property: every accepted encoding converts to its boolean.
 * Encodes: JSON booleans, 'true'/'false' and the '1'/'0' the web client sends
 * all reach the model as real booleans, for every boolean entrance field.
 */
describe('EntranceBooleanCoercion - Property: accepted encodings convert to booleans', () => {
  it('should convert every accepted encoding for every boolean field', function () {
    this.timeout(10000);

    const encodingArb = fc
      .boolean()
      .chain((b) =>
        fc.constantFrom(
          { input: b, expected: b },
          { input: String(b), expected: b },
          { input: b ? '1' : '0', expected: b }
        )
      );

    fc.assert(
      fc.property(fieldArb, encodingArb, (field, { input, expected }) => {
        const result = getConvertedDataFromClientRequest(
          mockReq({ [field]: input })
        );

        should(result[field]).equal(expected);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property: unrecognised values are flagged, never coerced.
 * Encodes: numbers and other casings used to be coerced (1 → true,
 * 'TRUE' → false); they now come out as parseBool.INVALID so the controller
 * can reject them.
 */
describe('EntranceBooleanCoercion - Property: unrecognised values are INVALID', () => {
  it('should flag numbers and case variants as INVALID', function () {
    this.timeout(10000);

    const unrecognisedArb = fc.oneof(
      fc.integer(),
      fc
        .constantFrom('true', 'false')
        .chain((s) => fc.mixedCase(fc.constant(s)).filter((v) => v !== s))
    );

    fc.assert(
      fc.property(fieldArb, unrecognisedArb, (field, value) => {
        const result = getConvertedDataFromClientRequest(
          mockReq({ [field]: value })
        );

        should(result[field]).equal(parseBool.INVALID);
      }),
      { numRuns: 100 }
    );
  });
});

describe('EntranceBooleanCoercion - absent values', () => {
  it('should return undefined for fields missing from the request', () => {
    const result = getConvertedDataFromClientRequest(mockReq({}));
    BOOLEAN_FIELDS.forEach((field) => should(result[field]).be.undefined());
  });

  it('should return undefined for null, so it never reaches a NOT NULL column', () => {
    const body = Object.fromEntries(BOOLEAN_FIELDS.map((f) => [f, null]));
    const result = getConvertedDataFromClientRequest(mockReq(body));
    BOOLEAN_FIELDS.forEach((field) => should(result[field]).be.undefined());
  });
});
