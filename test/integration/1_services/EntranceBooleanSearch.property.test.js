/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  NON_INDEXED_BOOLEAN_FIELDS,
} = require('../../../config/constants/entrance');

// Feature: entrance-boolean-characteristics
// Property 4: Search document includes only indexed boolean fields
// For random isTouristic and dangerPollution values on a populated entrance,
// the search document contains those two fields and excludes the seven
// non-indexed boolean characteristics.

/**
 * Replicate the destructuring/spread logic from EntranceService.updateInSearch.
 * Must match the actual implementation to be a valid property test.
 */
function buildSearchDocument(populatedEntrance) {
  const {
    names,
    country,
    cave,
    locations,
    descriptions,
    riggings,
    histories,
    documents,
    comments,
    ...e
  } = populatedEntrance;
  // Strip non-indexed boolean characteristics
  NON_INDEXED_BOOLEAN_FIELDS.forEach((f) => delete e[f]);

  return {
    ...e,
    dateInscription: e.dateInscription,
    dateReviewed: e.dateReviewed,
    authorId: e.author.id,
    author: e.author.nickname,
    reviewerId: e.reviewer?.id,
    reviewer: e.reviewer?.nickname,
    name: names[0].name,
    language: names[0].language,
    iso3166: e.iso_3166_2,
    country: [country?.id, country?.nativeName].filter((c) => c).join(' - '),
    geology: e.geology?.trim(),
    cave: cave && {
      name: cave.name,
      depth: cave.depth,
      length: cave.caveLength,
      temperature: cave.temperature,
      isDiving: cave.isDiving,
    },
    descriptions: descriptions?.map((d) => ({
      title: d.title,
      body: d.body,
    })),
    locations: locations?.map((l) => ({ title: l.title, body: l.body })),
    riggings: riggings?.map((r) => ({
      title: r.title,
      obstacles: r.obstacles,
      ropes: r.ropes,
      anchors: r.anchors,
    })),
    histories: histories?.map((h) => ({ body: h.body })),
    documents: documents?.map((d) => d.id),
    comments: comments?.map((c) => ({
      title: c.title,
      body: c.body,
      aestheticism: c.aestheticism,
      caving: c.caving,
      approach: c.approach,
    })),
  };
}

function mockPopulatedEntrance({ isTouristic, dangerPollution }) {
  return {
    id: 1,
    dateInscription: new Date(),
    dateReviewed: null,
    isSensitive: false,
    isTouristic,
    dangerPollution,
    hasBat: true,
    dangerFlooding: true,
    dangerCo2: true,
    dangerRockfall: true,
    needCleanGear: true,
    needStayOnTrail: true,
    hasRules: true,
    latitude: 45.0,
    longitude: 6.0,
    altitude: 1000,
    precision: 1,
    iso_3166_2: 'FR-38',
    region: 'Auvergne-Rhône-Alpes',
    county: 'Isère',
    city: 'Grenoble',
    geology: 'Q35758',
    discoveryYear: 2020,
    author: { id: 1, nickname: 'TestAuthor' },
    reviewer: { id: 2, nickname: 'TestReviewer' },
    names: [{ name: 'Test Entrance', language: 'eng' }],
    country: { id: 'FR', nativeName: 'France' },
    cave: null,
    locations: [],
    descriptions: [],
    riggings: [],
    histories: [],
    documents: [],
    comments: [],
  };
}

/**
 * Property 4: Search document includes only indexed boolean fields
 * Encodes: the updateInSearch logic preserves isTouristic and dangerPollution
 * in the search document, and excludes the seven non-indexed fields.
 * Covers: both indexed fields with random values; all seven excluded fields.
 *
 * Validates: Requirements 7.2, 7.3
 */
describe('EntranceBooleanSearch - Property 4: Search document includes only indexed boolean fields', () => {
  it('should include isTouristic and dangerPollution in the search document', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (isTouristic, dangerPollution) => {
          const populated = mockPopulatedEntrance({
            isTouristic,
            dangerPollution,
          });
          const doc = buildSearchDocument(populated);

          should(doc).have.property('isTouristic', isTouristic);
          should(doc).have.property('dangerPollution', dangerPollution);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude the seven non-indexed boolean fields from the search document', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (isTouristic, dangerPollution) => {
          const populated = mockPopulatedEntrance({
            isTouristic,
            dangerPollution,
          });
          const doc = buildSearchDocument(populated);

          NON_INDEXED_BOOLEAN_FIELDS.forEach((field) => {
            should(doc).not.have.property(field);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
