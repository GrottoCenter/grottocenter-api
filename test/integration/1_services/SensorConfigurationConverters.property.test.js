/* eslint-disable func-names */
/**
 * Property-based tests for the toSensorConfiguration converter.
 *
 * Property 1: Create-then-find round trip — output shape invariants
 * For any sensor configuration object with varying optional numeric field
 * presence, toSensorConfiguration output always has the correct shape with
 * all expected keys present.
 *
 * Property 5: Device find populates configurations with full objects
 * For any configuration with populated quantityKind/unit objects,
 * the converter output includes all expected fields in the nested objects.
 *
 * Validates: Requirements 1.1, 1.5, 2.1, 8.1
 */
const should = require('should');
const fc = require('fast-check');
const {
  toSensorConfiguration,
} = require('../../../api/services/mapping/converters');

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A positive integer ID */
const idArb = fc.integer({ min: 1, max: 100000 });

/** An optional numeric field (present or absent) */
const optionalNumericArb = fc.option(
  fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  { nil: undefined }
);

/** A simple caver object (as returned by populate) */
const simpleCaverArb = fc.record({
  id: idArb,
  nickname: fc.string({ minLength: 1, maxLength: 30 }),
});

/** A populated quantityKind object */
const quantityKindObjectArb = fc.record({
  id: idArb,
  code: fc.string({ minLength: 1, maxLength: 20 }),
  url: fc.webUrl(),
  symbolSi: fc.string({ minLength: 1, maxLength: 10 }),
  displaySymbol: fc.string({ minLength: 1, maxLength: 10 }),
  siToDisplayFactor: fc.double({
    min: -1e4,
    max: 1e4,
    noNaN: true,
    noDefaultInfinity: true,
  }),
  siToDisplayOffset: fc.double({
    min: -1e6,
    max: 1e6,
    noNaN: true,
    noDefaultInfinity: true,
  }),
});

/** A populated unit object */
const unitObjectArb = fc.record({
  id: idArb,
  code: fc.string({ minLength: 1, maxLength: 20 }),
  symbol: fc.string({ minLength: 1, maxLength: 10 }),
});

/** A date or null */
const dateOrNullArb = fc.option(fc.date(), { nil: null });

/**
 * Generate a sensor configuration source object with optional numeric fields
 * either present or absent. quantityKind/unit can be either an ID or an object.
 */
const sensorConfigSourceArb = (quantityKindArb, unitArb) =>
  fc.record({
    id: idArb,
    device: idArb,
    quantityKind: quantityKindArb,
    unit: unitArb,
    label: fc.option(fc.string({ minLength: 1, maxLength: 300 }), {
      nil: undefined,
    }),
    precisionUpper: optionalNumericArb,
    precisionLower: optionalNumericArb,
    resolution: optionalNumericArb,
    detectionLimitMin: optionalNumericArb,
    detectionLimitMax: optionalNumericArb,
    dateInscription: dateOrNullArb,
    dateReviewed: dateOrNullArb,
    isDeleted: fc.boolean(),
    author: fc.oneof(simpleCaverArb, idArb),
    reviewer: fc.oneof(simpleCaverArb, fc.constant(null), idArb),
  });

// ---------------------------------------------------------------------------
// Property 1: Create-then-find round trip — output shape invariants
// Validates: Requirements 1.1, 1.5, 2.1
// ---------------------------------------------------------------------------

describe('toSensorConfiguration - Property 1: Create-then-find round trip', () => {
  it('should always produce output with correct shape regardless of optional field presence', function () {
    this.timeout(30000);

    // Mix of populated objects and raw IDs for quantityKind/unit
    const sourceArb = sensorConfigSourceArb(
      fc.oneof(quantityKindObjectArb, idArb),
      fc.oneof(unitObjectArb, idArb)
    );

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toSensorConfiguration(source);

        // All top-level keys must be present
        should(result).have.property('id', source.id);
        should(result).have.property('device', source.device);
        should(result).have.property('quantityKind');
        should(result).have.property('unit');
        should(result).have.property('label');
        should(result).have.property('precisionUpper');
        should(result).have.property('precisionLower');
        should(result).have.property('resolution');
        should(result).have.property('detectionLimitMin');
        should(result).have.property('detectionLimitMax');
        should(result).have.property('dateInscription');
        should(result).have.property('dateReviewed');
        should(result).have.property('isDeleted');
        should(result).have.property('author');
        should(result).have.property('reviewer');

        // Numeric fields pass through exactly
        should(result.precisionUpper).equal(source.precisionUpper);
        should(result.precisionLower).equal(source.precisionLower);
        should(result.resolution).equal(source.resolution);
        should(result.detectionLimitMin).equal(source.detectionLimitMin);
        should(result.detectionLimitMax).equal(source.detectionLimitMax);

        // Boolean isDeleted preserved
        should(result.isDeleted).equal(source.isDeleted);
      }),
      { numRuns: 100 }
    );
  });

  it('should pass through quantityKind as raw ID when source is not an Object', function () {
    this.timeout(30000);

    const sourceArb = sensorConfigSourceArb(idArb, idArb);

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toSensorConfiguration(source);

        // When quantityKind is an integer, it passes through unchanged
        should(result.quantityKind).equal(source.quantityKind);
        should(result.unit).equal(source.unit);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Device find populates configurations with full objects
// Validates: Requirements 8.1
// ---------------------------------------------------------------------------

describe('toSensorConfiguration - Property 5: Device find populates configurations with full objects', () => {
  it('should include all quantityKind fields when populated as object', function () {
    this.timeout(30000);

    const sourceArb = sensorConfigSourceArb(
      quantityKindObjectArb,
      unitObjectArb
    );

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toSensorConfiguration(source);

        // quantityKind must be a full object with all 7 fields
        should(result.quantityKind).be.an.Object();
        should(result.quantityKind).have.property('id', source.quantityKind.id);
        should(result.quantityKind).have.property(
          'code',
          source.quantityKind.code
        );
        should(result.quantityKind).have.property(
          'url',
          source.quantityKind.url
        );
        should(result.quantityKind).have.property(
          'symbolSi',
          source.quantityKind.symbolSi
        );
        should(result.quantityKind).have.property(
          'displaySymbol',
          source.quantityKind.displaySymbol
        );
        should(result.quantityKind).have.property(
          'siToDisplayFactor',
          source.quantityKind.siToDisplayFactor
        );
        should(result.quantityKind).have.property(
          'siToDisplayOffset',
          source.quantityKind.siToDisplayOffset
        );

        // No extra fields leaked through
        should(Object.keys(result.quantityKind)).have.length(7);
      }),
      { numRuns: 100 }
    );
  });

  it('should include all unit fields when populated as object', function () {
    this.timeout(30000);

    const sourceArb = sensorConfigSourceArb(
      quantityKindObjectArb,
      unitObjectArb
    );

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toSensorConfiguration(source);

        // unit must be a full object with all 3 fields
        should(result.unit).be.an.Object();
        should(result.unit).have.property('id', source.unit.id);
        should(result.unit).have.property('code', source.unit.code);
        should(result.unit).have.property('symbol', source.unit.symbol);

        // No extra fields leaked through
        should(Object.keys(result.unit)).have.length(3);
      }),
      { numRuns: 100 }
    );
  });

  it('should convert author/reviewer to SimpleCaver shape when populated as objects', function () {
    this.timeout(30000);

    const sourceArb = fc.record({
      id: idArb,
      device: idArb,
      quantityKind: quantityKindObjectArb,
      unit: unitObjectArb,
      label: fc.option(fc.string({ minLength: 1, maxLength: 300 }), {
        nil: undefined,
      }),
      precisionUpper: optionalNumericArb,
      precisionLower: optionalNumericArb,
      resolution: optionalNumericArb,
      detectionLimitMin: optionalNumericArb,
      detectionLimitMax: optionalNumericArb,
      dateInscription: dateOrNullArb,
      dateReviewed: dateOrNullArb,
      isDeleted: fc.boolean(),
      author: simpleCaverArb,
      reviewer: simpleCaverArb,
    });

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toSensorConfiguration(source);

        // author and reviewer should be converted to { id, nickname }
        should(result.author).be.an.Object();
        should(result.author).have.property('id', source.author.id);
        should(result.author).have.property('nickname', source.author.nickname);
        should(Object.keys(result.author)).have.length(2);

        should(result.reviewer).be.an.Object();
        should(result.reviewer).have.property('id', source.reviewer.id);
        should(result.reviewer).have.property(
          'nickname',
          source.reviewer.nickname
        );
        should(Object.keys(result.reviewer)).have.length(2);
      }),
      { numRuns: 100 }
    );
  });
});
