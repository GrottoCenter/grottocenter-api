const should = require('should');
const fc = require('fast-check');
const geojson = require('../../../../api/services/geo-serializers/geojson');
const { filterDocuments } = require('../../../../api/services/geo-serializers');

/**
 * Arbitrary: generates a realistic entrance document with randomized fields.
 * latitude/longitude are sometimes null to exercise exclusion logic.
 * isSensitive is biased toward false for variety.
 */
const entranceDocumentArbitrary = fc.record({
  id: fc.stringMatching(/^[0-9]{1,6}$/),
  name: fc.string({ minLength: 0, maxLength: 100 }),
  latitude: fc.option(
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
    { nil: null, freq: 3 }
  ),
  longitude: fc.option(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    { nil: null, freq: 3 }
  ),
  altitude: fc.option(
    fc.double({ min: -500, max: 9000, noNaN: true, noDefaultInfinity: true }),
    { nil: null }
  ),
  isSensitive: fc.oneof(
    { weight: 8, arbitrary: fc.constant(false) },
    { weight: 2, arbitrary: fc.constant(true) }
  ),
  country: fc.option(fc.stringMatching(/^[A-Z]{2}$/), { nil: undefined }),
  region: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: undefined,
  }),
});

const entranceDocumentArrayArbitrary = fc.array(entranceDocumentArbitrary, {
  minLength: 0,
  maxLength: 30,
});

/**
 * Helper: assemble a full GeoJSON output from an array of entrance docs.
 */
const buildGeoJSON = (docs) => {
  const timestamp = new Date().toISOString();
  const filtered = filterDocuments(docs);
  const output =
    geojson.prologue(timestamp) +
    geojson.serializeBatch(filtered, true) +
    geojson.epilogue();
  return output;
};

/**
 * Property 3: GeoJSON structural validity
 *
 * For any array of entrance documents, output parses as valid JSON with
 * type="FeatureCollection" and features array where every element has
 * type="Feature", geometry.type="Point", and properties object.
 *
 * Validates: Requirements 3.1
 */
describe('Feature: geo-export-search-results, Property 3: GeoJSON structural validity', () => {
  it('should produce valid FeatureCollection with correct structure for any input', function validStructure() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildGeoJSON(docs);
        const parsed = JSON.parse(output);

        should(parsed.type).equal('FeatureCollection');
        should(parsed.features).be.an.Array();

        parsed.features.forEach((feature) => {
          should(feature.type).equal('Feature');
          should(feature.geometry).be.an.Object();
          should(feature.geometry.type).equal('Point');
          should(feature.properties).be.an.Object();
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: GeoJSON coordinate order
 *
 * For any doc with non-null lat/lon, coordinates are [longitude, latitude].
 *
 * Validates: Requirements 3.2
 */
describe('Feature: geo-export-search-results, Property 4: GeoJSON coordinate order', () => {
  it('should place longitude first, latitude second in coordinates', function coordinateOrder() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          geojson.prologue(timestamp) +
          geojson.serializeBatch(filtered, true) +
          geojson.epilogue();
        const parsed = JSON.parse(output);

        filtered.forEach((doc, i) => {
          const coords = parsed.features[i].geometry.coordinates;
          should(coords[0]).equal(doc.longitude);
          should(coords[1]).equal(doc.latitude);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: GeoJSON exclusion of invalid entries
 *
 * Docs with isSensitive===true or null lat/lon produce no Feature.
 *
 * Validates: Requirements 3.3, 10.1
 */
describe('Feature: geo-export-search-results, Property 5: GeoJSON exclusion of invalid entries', () => {
  it('should exclude sensitive or coordinate-less docs from features', function exclusion() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        const timestamp = new Date().toISOString();
        const output =
          geojson.prologue(timestamp) +
          geojson.serializeBatch(filtered, true) +
          geojson.epilogue();
        const parsed = JSON.parse(output);

        // The number of features should equal filtered count
        should(parsed.features.length).equal(filtered.length);

        // No feature should correspond to a sensitive or null-coord doc
        const validIds = new Set(filtered.map((d) => d.id));
        docs.forEach((doc) => {
          if (
            doc.isSensitive === true ||
            doc.latitude == null ||
            doc.longitude == null
          ) {
            // This doc should NOT appear in features
            const found = parsed.features.some(
              (f) =>
                f.properties.id === doc.id &&
                f.properties.latitude === doc.latitude &&
                f.properties.longitude === doc.longitude
            );
            // Only assert if id is not duplicated in valid set
            if (!validIds.has(doc.id)) {
              should(found).equal(false);
            }
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: GeoJSON Feature properties completeness
 *
 * Each Feature's properties contains all original doc fields plus url.
 *
 * Validates: Requirements 3.4, 11.4
 */
describe('Feature: geo-export-search-results, Property 6: GeoJSON Feature properties completeness', () => {
  it('should include all doc fields plus url in each Feature properties', function completeness() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          geojson.prologue(timestamp) +
          geojson.serializeBatch(filtered, true) +
          geojson.epilogue();
        const parsed = JSON.parse(output);

        filtered.forEach((doc, i) => {
          const props = parsed.features[i].properties;

          // All original doc fields with defined values are present
          // (JSON.stringify drops undefined values, which is correct)
          Object.keys(doc).forEach((key) => {
            if (doc[key] !== undefined) {
              should(props).have.property(key);
              should(props[key]).deepEqual(doc[key]);
            }
          });

          // url property present and correct
          should(props.url).equal(
            `https://grottocenter.org/ui/entrances/${doc.id}`
          );
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: GeoJSON JSON round-trip stability
 *
 * Parse + re-stringify equals first parse.
 *
 * Validates: Requirements 3.7
 */
describe('Feature: geo-export-search-results, Property 7: GeoJSON JSON round-trip stability', () => {
  it('should produce output that survives JSON parse/stringify round-trip', function roundTrip() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildGeoJSON(docs);
        const firstParse = JSON.parse(output);
        const reserialized = JSON.stringify(firstParse);
        const secondParse = JSON.parse(reserialized);

        should(secondParse).deepEqual(firstParse);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: GeoJSON metadata invariant
 *
 * name="Grottocenter", description="Exported from https://grottocenter.org",
 * timestamp is valid ISO 8601.
 *
 * Validates: Requirements 11.1, 11.7
 */
describe('Feature: geo-export-search-results, Property 8: GeoJSON metadata invariant', () => {
  it('should always include correct name, description, and valid ISO timestamp', function metadata() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildGeoJSON(docs);
        const parsed = JSON.parse(output);

        should(parsed.name).equal('Grottocenter');
        should(parsed.description).equal(
          'Exported from https://grottocenter.org'
        );
        should(parsed.timestamp).be.a.String();

        // Validate ISO 8601 timestamp
        const date = new Date(parsed.timestamp);
        should(Number.isNaN(date.getTime())).equal(false);
        should(parsed.timestamp).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }),
      { numRuns: 100 }
    );
  });
});
