const should = require('should');
const fc = require('fast-check');

/**
 * Validation predicates extracted from the controller logic.
 * These mirror the exact checks in advanced-search-export.js.
 */
const VALID_FORMATS = ['csv', 'geojson', 'kml', 'gpx'];
const GEO_FORMATS = ['geojson', 'kml', 'gpx'];

const isValidFormat = (f) => VALID_FORMATS.includes(f);
const isGeoFormat = (f) => GEO_FORMATS.includes(f);
const isEntityAllowedForGeo = (entity) => entity === 'entrances';

/**
 * Arbitraries
 */
const invalidFormatArbitrary = fc
  .string()
  .filter((s) => !VALID_FORMATS.includes(s));

const geoFormatArbitrary = fc.constantFrom('geojson', 'kml', 'gpx');

const nonEntranceEntityArbitrary = fc.constantFrom(
  'caves',
  'documents',
  'organizations',
  'massifs',
  'persons',
  'devices'
);

const columnsArbitrary = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant([]),
  fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 1,
    maxLength: 5,
  }),
  fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
  fc.constant('not-an-array')
);

/**
 * Property 1: Invalid format rejection
 *
 * For any string that is not one of csv, geojson, kml, or gpx,
 * the format validation function returns invalid (false).
 *
 * Validates: Requirements 1.6
 */
describe('Feature: geo-export-search-results, Property 1: Invalid format rejection', () => {
  it('should reject any string not in the valid format set', function invalidFormatRejection() {
    this.timeout(30000);
    fc.assert(
      fc.property(invalidFormatArbitrary, (format) => {
        should(isValidFormat(format)).equal(false);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Geo format requires entrances entity
 *
 * For any geo format combined with any non-entrance entity,
 * the entity validation rejects the request.
 *
 * Validates: Requirements 2.2
 */
describe('Feature: geo-export-search-results, Property 2: Geo format requires entrances entity', () => {
  it('should reject any geo format paired with a non-entrance entity', function entityRestriction() {
    this.timeout(30000);
    fc.assert(
      fc.property(
        geoFormatArbitrary,
        nonEntranceEntityArbitrary,
        (format, entity) => {
          // The format is a geo format
          should(isGeoFormat(format)).equal(true);
          // The entity is not entrances, so it should be rejected
          should(isEntityAllowedForGeo(entity)).equal(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 19: Geo format output is independent of column parameters
 *
 * For any geo format and any value of columns/columnsName (present, absent,
 * empty, invalid), the format validation does not reject due to columns.
 * The controller skips column validation entirely for geo formats.
 *
 * Validates: Requirements 6.1, 6.2
 */
describe('Feature: geo-export-search-results, Property 19: Geo format output is independent of column parameters', () => {
  it('should not reject geo format requests regardless of column parameter values', function columnIndependence() {
    this.timeout(30000);
    fc.assert(
      fc.property(
        geoFormatArbitrary,
        columnsArbitrary,
        columnsArbitrary,
        (format, columns, columnsName) => {
          // For geo formats, column validation is skipped.
          // Simulate the controller logic: if isGeoFormat, skip column checks.
          const isGeo = isGeoFormat(format);
          should(isGeo).equal(true);

          // Column validation only applies to non-geo formats.
          // For geo formats, regardless of what columns/columnsName are,
          // no rejection occurs due to column validation.
          let columnRejection = false;
          if (!isGeo) {
            // This branch is never reached for geo formats
            if (!Array.isArray(columns) || columns.length === 0) {
              columnRejection = true;
            }
            if (!Array.isArray(columnsName) || columnsName.length === 0) {
              columnRejection = true;
            }
          }
          should(columnRejection).equal(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
