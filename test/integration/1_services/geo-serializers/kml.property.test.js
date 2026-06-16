const should = require('should');
const fc = require('fast-check');
const kml = require('../../../../api/services/geo-serializers/kml');
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
 * Helper: assemble full KML output from an array of entrance docs.
 */
const buildKML = (docs) => {
  const timestamp = new Date().toISOString();
  const filtered = filterDocuments(docs);
  const output =
    kml.prologue(timestamp) +
    kml.serializeBatch(filtered, true) +
    kml.epilogue();
  return output;
};

/**
 * Property 9: KML structural validity
 *
 * Root is <kml> with namespace, contains single <Document>, zero or more <Placemark>.
 *
 * Validates: Requirements 4.1
 */
describe('Feature: geo-export-search-results, Property 9: KML structural validity', () => {
  it('should produce valid KML with kml root, namespace, Document, and Placemarks', function validStructure() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildKML(docs);

        // XML declaration
        should(output).startWith('<?xml version="1.0" encoding="UTF-8"?>');

        // Root <kml> with correct namespace
        should(output).match(
          /<kml xmlns="http:\/\/www\.opengis\.net\/kml\/2\.2">/
        );

        // Single <Document> element
        const documentOpens = (output.match(/<Document>/g) || []).length;
        const documentCloses = (output.match(/<\/Document>/g) || []).length;
        should(documentOpens).equal(1);
        should(documentCloses).equal(1);

        // Closing </kml>
        should(output).endWith('</Document></kml>');

        // Count Placemarks matches filtered doc count
        const filtered = filterDocuments(docs);
        const placemarkCount = (output.match(/<Placemark>/g) || []).length;
        should(placemarkCount).equal(filtered.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: KML coordinate format
 *
 * Placemark coordinates are `lon,lat,alt` with alt=0 if absent.
 *
 * Validates: Requirements 4.2
 */
describe('Feature: geo-export-search-results, Property 10: KML coordinate format', () => {
  it('should format coordinates as lon,lat,alt with alt=0 when absent', function coordinateFormat() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          kml.prologue(timestamp) +
          kml.serializeBatch(filtered, true) +
          kml.epilogue();

        // Extract all <coordinates> content
        const coordMatches =
          output.match(/<coordinates>([^<]+)<\/coordinates>/g) || [];
        should(coordMatches.length).equal(filtered.length);

        filtered.forEach((doc, i) => {
          const expectedAlt = doc.altitude != null ? doc.altitude : 0;
          const expectedCoords = `${doc.longitude},${doc.latitude},${expectedAlt}`;
          const actual = coordMatches[i].replace(/<\/?coordinates>/g, '');
          should(actual).equal(expectedCoords);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: KML exclusion of invalid entries
 *
 * Sensitive or null-coord docs produce no Placemark.
 *
 * Validates: Requirements 4.3, 10.2
 */
describe('Feature: geo-export-search-results, Property 11: KML exclusion of invalid entries', () => {
  it('should produce no Placemark for sensitive or coordinate-less docs', function exclusion() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        const output = buildKML(docs);

        // The number of Placemarks must equal the number of filtered docs
        const placemarkCount = (output.match(/<Placemark>/g) || []).length;
        should(placemarkCount).equal(filtered.length);

        // Additionally, verify that every excluded doc's coordinates
        // do NOT appear as Placemark Point coordinates in the output
        const coordMatches =
          output.match(/<coordinates>([^<]+)<\/coordinates>/g) || [];
        docs.forEach((doc) => {
          if (
            doc.isSensitive === true ||
            doc.latitude == null ||
            doc.longitude == null
          ) {
            // If this doc has valid coords but is sensitive, verify its exact coords aren't in output
            if (doc.latitude != null && doc.longitude != null) {
              const alt = doc.altitude != null ? doc.altitude : 0;
              const excludedCoords = `${doc.longitude},${doc.latitude},${alt}`;
              // Only assert if this exact coord string doesn't also belong to a valid doc
              const validDocHasSameCoords = filtered.some(
                (d) =>
                  `${d.longitude},${d.latitude},${d.altitude != null ? d.altitude : 0}` ===
                  excludedCoords
              );
              if (!validDocHasSameCoords) {
                const found = coordMatches.some((m) =>
                  m.includes(excludedCoords)
                );
                should(found).equal(false);
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
 * Property 12: KML Placemark data completeness
 *
 * Each Placemark has <name>, <ExtendedData> with Data for all fields + url.
 *
 * Validates: Requirements 4.4, 4.5, 11.5
 */
describe('Feature: geo-export-search-results, Property 12: KML Placemark data completeness', () => {
  it('should include name and ExtendedData with all fields plus url in each Placemark', function completeness() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const filtered = filterDocuments(docs);
        if (filtered.length === 0) return;

        const timestamp = new Date().toISOString();
        const output =
          kml.prologue(timestamp) +
          kml.serializeBatch(filtered, true) +
          kml.epilogue();

        // Split into Placemarks
        const placemarks = output.split('<Placemark>').slice(1);
        should(placemarks.length).equal(filtered.length);

        filtered.forEach((doc, i) => {
          const pm = placemarks[i];

          // Has <name> element
          should(pm).match(/<name>[^<]*<\/name>/);

          // Has <ExtendedData>
          should(pm).match(/<ExtendedData>/);

          // Has Data elements for each doc field
          Object.keys(doc).forEach((key) => {
            const dataPattern = new RegExp(`<Data name="${key}">`);
            should(pm).match(dataPattern);
          });

          // Has url Data element
          should(pm).match(/<Data name="url">/);
          const expectedUrl = `https://grottocenter.org/ui/entrances/${doc.id}`;
          should(pm).containEql(expectedUrl);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 13: KML metadata invariant
 *
 * Document name="Grottocenter", description present, TimeStamp with ISO 8601.
 *
 * Validates: Requirements 11.2, 11.8
 */
describe('Feature: geo-export-search-results, Property 13: KML metadata invariant', () => {
  it('should always include correct Document name, description, and valid TimeStamp', function metadata() {
    this.timeout(30000);
    fc.assert(
      fc.property(entranceDocumentArrayArbitrary, (docs) => {
        const output = buildKML(docs);

        // Document <name> is Grottocenter (first <name> after <Document>)
        const docSection = output
          .split('<Document>')[1]
          .split('</Document>')[0];
        const firstNameMatch = docSection.match(/<name>([^<]*)<\/name>/);
        should(firstNameMatch).not.be.null();
        should(firstNameMatch[1]).equal('Grottocenter');

        // Description present
        should(output).match(
          /<description>Exported from https:\/\/grottocenter\.org<\/description>/
        );

        // TimeStamp with ISO 8601
        const timestampMatch = output.match(
          /<TimeStamp><when>([^<]+)<\/when><\/TimeStamp>/
        );
        should(timestampMatch).not.be.null();
        const date = new Date(timestampMatch[1]);
        should(Number.isNaN(date.getTime())).equal(false);
        should(timestampMatch[1]).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }),
      { numRuns: 100 }
    );
  });
});
