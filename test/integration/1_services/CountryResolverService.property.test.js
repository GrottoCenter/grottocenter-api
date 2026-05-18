/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const CountryResolverService = require('../../../api/services/CountryResolverService');

// All ISO alpha-2 codes that could appear in hierarchies
const ALL_CODES = [
  'FR',
  'ES',
  'GB',
  'US',
  'DE',
  'IT',
  'RE',
  'GP',
  'MQ',
  'GF',
  'YT',
  'PM',
  'WF',
  'BL',
  'MF',
  'NC',
  'PF',
  'GI',
  'JE',
  'GG',
  'IM',
  'AI',
  'BM',
  'VG',
  'KY',
  'FK',
  'MS',
  'SH',
  'TC',
  'PR',
  'VI',
  'GU',
  'AS',
  'MP',
];

/**
 * Property 1: Hierarchy resolution returns the most specific cached code
 *
 * For any set of country codes in the cache and any hierarchy of features
 * returned by featuresContaining(), resolve() returns the first (most-specific)
 * code from the hierarchy that exists in the cache, or '00' if none match.
 *
 * Validates: Requirements 1.1, 1.3, 1.5, 7.1, 7.2, 7.3, 7.4
 */
describe('CountryResolverService - Property 1: Hierarchy resolution returns the most specific cached code', () => {
  let originalCache;

  before(async () => {
    // Ensure country-coder is loaded
    await CountryResolverService.loadCache();
    originalCache = CountryResolverService.countryCache;
  });

  afterEach(() => {
    sinon.restore();
    CountryResolverService.countryCache = originalCache;
  });

  it('should return the first hierarchy code found in cache, or 00 if none match', function () {
    this.timeout(30000);

    // Arbitrary: random subset of codes for the cache
    const cacheArb = fc.uniqueArray(fc.constantFrom(...ALL_CODES), {
      minLength: 0,
      maxLength: 15,
    });

    // Arbitrary: random hierarchy (ordered array of features, most-specific first)
    const hierarchyArb = fc.array(
      fc.constantFrom(...ALL_CODES).map((code) => ({
        type: 'Feature',
        properties: { iso1A2: code },
      })),
      { minLength: 0, maxLength: 8 }
    );

    fc.assert(
      fc.property(cacheArb, hierarchyArb, (cacheSet, hierarchy) => {
        // Set up the cache
        CountryResolverService.countryCache = new Set(cacheSet);

        // Stub getFeaturesContaining on the service
        const stub = sinon.stub(
          CountryResolverService,
          'getFeaturesContaining'
        );
        stub.returns(hierarchy);

        // Call resolve with arbitrary valid coordinates
        const result = CountryResolverService.resolve(45.0, 2.0);

        // Find the expected result: first code in hierarchy that's in cache
        let expectedCode = '00';
        for (const feat of hierarchy) {
          const code = feat.properties.iso1A2;
          if (code && cacheSet.includes(code)) {
            expectedCode = code;
            break;
          }
        }

        should(result).equal(expectedCode);

        // Additional assertion: if a more-specific code exists in cache,
        // it is returned over a less-specific one
        if (expectedCode !== '00') {
          const indexInHierarchy = hierarchy.findIndex(
            (f) => f.properties.iso1A2 === expectedCode
          );
          // No earlier code in the hierarchy should be in the cache
          // (otherwise it would have been returned instead)
          for (let i = 0; i < indexInHierarchy; i += 1) {
            const earlierCode = hierarchy[i].properties.iso1A2;
            should(cacheSet.includes(earlierCode)).be.false(
              `Code ${earlierCode} at index ${i} is in cache but ${expectedCode} at index ${indexInHierarchy} was returned`
            );
          }
        }

        stub.restore();
      }),
      { numRuns: 100 }
    );
  });
});
