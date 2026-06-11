const should = require('should');
const fc = require('fast-check');
const {
  toDevice,
  toSimpleDevice,
} = require('../../../api/services/mapping/converters');

/**
 * Arbitrary: generates a random device-like object with both populated
 * (object) and null author/reviewer to exercise convertIfObject branching.
 */
const caverArb = fc.record({
  id: fc.integer({ min: 1, max: 99999 }),
  nickname: fc.string({ minLength: 1, maxLength: 50 }),
});

const deviceArb = fc.record({
  id: fc.integer({ min: 1, max: 99999 }),
  name: fc.string({ minLength: 0, maxLength: 300 }),
  brandName: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  productUrl: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  manufacturerUrl: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  dateInscription: fc.option(
    fc
      .integer({ min: 946684800000, max: 4102444800000 })
      .map((ms) => new Date(ms).toISOString()),
    {
      nil: null,
    }
  ),
  dateReviewed: fc.option(
    fc
      .integer({ min: 946684800000, max: 4102444800000 })
      .map((ms) => new Date(ms).toISOString()),
    {
      nil: null,
    }
  ),
  isDeleted: fc.boolean(),
  author: fc.oneof(caverArb, fc.constant(null), fc.constant(1)),
  reviewer: fc.oneof(caverArb, fc.constant(null), fc.constant(2)),
  configurations: fc.oneof(
    fc.constant([]),
    fc.array(fc.record({ id: fc.integer({ min: 1, max: 999 }) }), {
      maxLength: 5,
    }),
    fc.constant(undefined)
  ),
});

/**
 * Property 5: Response shape invariant.
 * toDevice always returns the same JSON shape regardless of whether
 * associations are populated or null.
 *
 * Validates: Requirements 2.1, 4.1
 */
describe('DeviceService - Property 5: Response shape invariant (toDevice)', () => {
  it('should always return an object with the expected keys regardless of populated/null associations', function toDeviceShapeInvariant() {
    this.timeout(30000);
    fc.assert(
      fc.property(deviceArb, (device) => {
        const result = toDevice(device);

        should(result).have.property('id');
        should(result).have.property('name');
        should(result).have.property('brandName');
        should(result).have.property('productUrl');
        should(result).have.property('manufacturerUrl');
        should(result).have.property('dateInscription');
        should(result).have.property('dateReviewed');
        should(result).have.property('isDeleted');
        should(result).have.property('author');
        should(result).have.property('reviewer');
        should(result).have.property('configurations');

        // configurations is always an array
        should(result.configurations).be.an.Array();

        // Verify exact key set (no extra keys)
        const keys = Object.keys(result).sort();
        should(keys).deepEqual(
          [
            'author',
            'brandName',
            'configurations',
            'dateInscription',
            'dateReviewed',
            'id',
            'isDeleted',
            'manufacturerUrl',
            'name',
            'productUrl',
            'reviewer',
          ].sort()
        );
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * toSimpleDevice output shape invariant.
 * toSimpleDevice always returns exactly the expected shape
 * (id, name, brandName, productUrl, manufacturerUrl, isDeleted).
 *
 * Validates: Requirements 2.1
 */
describe('DeviceService - Property: toSimpleDevice output shape invariant', () => {
  it('should always return an object with exactly the expected keys', function toSimpleDeviceShapeInvariant() {
    this.timeout(30000);
    fc.assert(
      fc.property(deviceArb, (device) => {
        const result = toSimpleDevice(device);

        should(result).have.property('id');
        should(result).have.property('name');
        should(result).have.property('brandName');
        should(result).have.property('productUrl');
        should(result).have.property('manufacturerUrl');
        should(result).have.property('isDeleted');
        should(result).have.property('author');

        // Verify exact key set (no extra keys)
        const keys = Object.keys(result).sort();
        should(keys).deepEqual(
          [
            'author',
            'brandName',
            'id',
            'isDeleted',
            'manufacturerUrl',
            'name',
            'productUrl',
          ].sort()
        );
      }),
      { numRuns: 100 }
    );
  });
});
