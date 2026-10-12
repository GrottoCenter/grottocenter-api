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

const {
  search: { importFormater },
} = require('../../../api/dbSync/entities/entrance');

// A row as the entrance entity's processRows yields it, every boolean set
function entranceRow({ isTouristic, dangerPollution }) {
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
    name: 'Test Entrance',
    language: 'eng',
    comments: [],
  };
}

/**
 * Property 4: Search document includes only indexed boolean fields
 * Encodes: the entrances importFormater, which formats every indexed
 * entrance (full rebuild and single update), preserves isTouristic and dangerPollution
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
          const doc = importFormater(
            entranceRow({ isTouristic, dangerPollution })
          );

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
          const doc = importFormater(
            entranceRow({ isTouristic, dangerPollution })
          );

          NON_INDEXED_BOOLEAN_FIELDS.forEach((field) => {
            should(doc).not.have.property(field);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
