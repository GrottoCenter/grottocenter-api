const should = require('should');
const CountryResolverService = require('../../../api/services/CountryResolverService');

describe('CountryResolverService', () => {
  describe('loadCache()', () => {
    it('should populate the cache with country codes from fixtures', async () => {
      await CountryResolverService.loadCache();
      should(CountryResolverService.countryCache).be.an.instanceof(Set);
      should(CountryResolverService.countryCache.size).be.greaterThan(0);
      // Test fixtures have ES, FR, GB, US
      should(CountryResolverService.countryCache.has('ES')).be.true();
      should(CountryResolverService.countryCache.has('FR')).be.true();
      should(CountryResolverService.countryCache.has('GB')).be.true();
      should(CountryResolverService.countryCache.has('US')).be.true();
    });
  });

  describe('resolve()', () => {
    before(async () => {
      await CountryResolverService.loadCache();
    });

    it('should resolve coordinates in France to FR', () => {
      // Central France (46.2, 2.2)
      const result = CountryResolverService.resolve(46.2, 2.2);
      should(result).equal('FR');
    });

    it('should resolve ocean coordinates (0, 0) to 00', () => {
      const result = CountryResolverService.resolve(0, 0);
      should(result).equal('00');
    });

    it('should resolve overseas territory Réunion to FR (RE not in fixtures)', () => {
      // Réunion (-21.1, 55.5) — RE is not in the test fixtures,
      // so it should fall back to the sovereign FR
      const result = CountryResolverService.resolve(-21.1, 55.5);
      should(result).equal('FR');
    });

    it('should return 00 for NaN latitude', () => {
      const result = CountryResolverService.resolve(NaN, 2.2);
      should(result).equal('00');
    });

    it('should return 00 for NaN longitude', () => {
      const result = CountryResolverService.resolve(46.2, NaN);
      should(result).equal('00');
    });

    it('should return 00 for undefined inputs', () => {
      const result = CountryResolverService.resolve(undefined, undefined);
      should(result).equal('00');
    });

    it('should return 00 for null inputs', () => {
      const result = CountryResolverService.resolve(null, null);
      should(result).equal('00');
    });

    it('should return 00 for non-numeric string inputs', () => {
      const result = CountryResolverService.resolve('abc', 'xyz');
      should(result).equal('00');
    });

    it('should return 00 when cache is null (not loaded)', () => {
      const originalCache = CountryResolverService.countryCache;
      CountryResolverService.countryCache = null;

      const result = CountryResolverService.resolve(46.2, 2.2);
      should(result).equal('00');

      // Restore
      CountryResolverService.countryCache = originalCache;
    });
  });
});
