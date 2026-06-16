const should = require('should');
const fc = require('fast-check');
const gpx = require('../../../../api/services/geo-serializers/gpx');
const { filterDocuments } = require('../../../../api/services/geo-serializers');

/**
 * Arbitrary: generates a realistic entrance document with randomized fields.
 * Uses only XML-safe characters in name to avoid escaped-string matching issues.
 */
const entranceDocumentArbitrary = fc.record({
  id: fc.stringMatching(/^[0-9]{1,6}$/),
  name: fc.stringMatching(/^[a-zA-Z0-9 ]{0,50}$/),
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
});

const entranceDocumentArrayArbitrary = fc.array(entranceDocumentArbitrary, {
  minLength: 0,
  maxLength: 30,
});

/**
 * Helper: assemble full GPX output from an array of entrance docs.
 */
const buildGPX = (docs) => {
  const timestamp = new Date().toISOString();
  const filtered = filterDocuments(docs);
  const output =
    gpx.prologue(timestamp) +
    gpx.serializeBatch(filtered, true) +
    gpx.epilogue();
  return output;
};

/**
 * Property 14: GPX structural validity
 *
 * Root is <gpx> with correct namespace, version="1.1", creator="Grottocenter",
 * has <metadata>.
 *
 * Validates: Requirements 5.1
 */
describe('Feature: geo-export-search-results, Property 14: GPX structural validity', () => {
  it('should produce valid GPX with correct root element, namespace, version, creator, and metadata', function validStructure() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildGPX(docs);

        // XML declaration
        should(output).startWith('<?xml version="1.0" encoding="UTF-8"?>');

        // Root <gpx> with correct namespace
        should(output).match(
          /<gpx xmlns="http:\/\/www\.topografix\.com\/GPX\/1\/1"/
        );

        // version attribute
        should(output).match(/version="1\.1"/);

        // creator attribute
        should(output).match(/creator="Grottocenter"/);

        // Schema location
        should(output).match(
          /xsi:schemaLocation="http:\/\/www\.topografix\.com\/GPX\/1\/1 http:\/\/www\.topografix\.com\/GPX\/1\/1\/gpx\.xsd"/
        );

        // <metadata> element present
        should(output).match(/<metadata>/);
        should(output).match(/<\/metadata>/);

        // Closing </gpx>
        should(output).endWith('</gpx>');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: GPX waypoint coordinates
 *
 * <wpt> has lat/lon attributes as decimal degrees.
 *
 * Validates: Requirements 5.2
 */
describe('Feature: geo-export-search-results, Property 15: GPX waypoint coordinates', () => {
  it('should set lat and lon attributes on wpt elements as decimal degrees', function waypointCoordinates() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          gpx.prologue(timestamp) +
          gpx.serializeBatch(filtered, true) +
          gpx.epilogue();

        // Extract all <wpt> elements with lat/lon
        const wptMatches =
          output.match(/<wpt lat="([^"]+)" lon="([^"]+)">/g) || [];
        should(wptMatches.length).equal(filtered.length);

        filtered.forEach((doc, i) => {
          const match = wptMatches[i].match(
            /<wpt lat="([^"]+)" lon="([^"]+)">/
          );
          should(match).not.be.null();

          const lat = parseFloat(match[1]);
          const lon = parseFloat(match[2]);

          should(lat).equal(doc.latitude);
          should(lon).equal(doc.longitude);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 16: GPX exclusion of invalid entries
 *
 * Sensitive or null-coord docs produce no <wpt>.
 *
 * Validates: Requirements 5.3, 10.3
 */
describe('Feature: geo-export-search-results, Property 16: GPX exclusion of invalid entries', () => {
  it('should produce no wpt for sensitive or coordinate-less docs', function exclusion() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        const output = buildGPX(docs);

        // The number of wpt elements must equal filtered doc count
        const wptCount = (output.match(/<wpt /g) || []).length;
        should(wptCount).equal(filtered.length);

        // Additionally, verify excluded docs with valid coords don't have
        // their exact lat/lon in any wpt attribute
        const wptMatches =
          output.match(/<wpt lat="([^"]+)" lon="([^"]+)">/g) || [];
        docs.forEach((doc) => {
          if (
            doc.isSensitive === true ||
            doc.latitude == null ||
            doc.longitude == null
          ) {
            if (doc.latitude != null && doc.longitude != null) {
              const excludedWpt = `<wpt lat="${doc.latitude}" lon="${doc.longitude}">`;
              // Only assert if no valid doc shares these exact coords
              const validDocHasSameCoords = filtered.some(
                (d) =>
                  d.latitude === doc.latitude && d.longitude === doc.longitude
              );
              if (!validDocHasSameCoords) {
                should(wptMatches.some((m) => m === excludedWpt)).equal(false);
              }
            }
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 17: GPX waypoint content completeness
 *
 * Each wpt has <name>, <ele> if altitude non-null, <link> with url.
 *
 * Validates: Requirements 5.4, 5.5, 5.6, 11.6
 */
describe('Feature: geo-export-search-results, Property 17: GPX waypoint content completeness', () => {
  it('should include name, conditional ele, and link in each wpt', function completeness() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          gpx.prologue(timestamp) +
          gpx.serializeBatch(filtered, true) +
          gpx.epilogue();

        // Split output into individual wpt blocks
        const wptBlocks = output.split('<wpt ').slice(1);
        should(wptBlocks.length).equal(filtered.length);

        filtered.forEach((doc, i) => {
          const wpt = wptBlocks[i];

          // Has <name> element
          should(wpt).match(/<name>[^<]*<\/name>/);

          // Has <ele> only when altitude is non-null
          if (doc.altitude != null) {
            should(wpt).match(/<ele>[^<]+<\/ele>/);
            const eleMatch = wpt.match(/<ele>([^<]+)<\/ele>/);
            should(eleMatch).not.be.null();
            should(parseFloat(eleMatch[1])).equal(doc.altitude);
          } else {
            should(wpt).not.match(/<ele>/);
          }

          // Has <link> with correct href
          const expectedUrl = `https://grottocenter.org/ui/entrances/${doc.id}`;
          should(wpt).containEql(`<link href="${expectedUrl}">`);
          should(wpt).containEql('<text>View on Grottocenter</text>');
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 18: GPX metadata invariant
 *
 * metadata has name="Grottocenter", desc present, time is ISO 8601.
 *
 * Validates: Requirements 11.3, 11.9
 */
describe('Feature: geo-export-search-results, Property 18: GPX metadata invariant', () => {
  it('should always include correct metadata name, desc, and valid ISO time', function metadataInvariant() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildGPX(docs);

        // Extract metadata section
        const metadataMatch = output.match(/<metadata>([\s\S]*?)<\/metadata>/);
        should(metadataMatch).not.be.null();
        const metadata = metadataMatch[1];

        // <name>Grottocenter</name>
        should(metadata).match(/<name>Grottocenter<\/name>/);

        // <desc> present
        should(metadata).match(
          /<desc>Exported from https:\/\/grottocenter\.org<\/desc>/
        );

        // <time> with valid ISO 8601
        const timeMatch = metadata.match(/<time>([^<]+)<\/time>/);
        should(timeMatch).not.be.null();
        const date = new Date(timeMatch[1]);
        should(Number.isNaN(date.getTime())).equal(false);
        should(timeMatch[1]).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }),
      { numRuns: 100 }
    );
  });
});
