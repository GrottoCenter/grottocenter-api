const should = require('should');
const sinon = require('sinon');
const CountryService = require('../../../api/services/CountryService');
const CommonService = require('../../../api/services/CommonService');
const StatisticsCountryService = require('../../../api/services/StatisticsCountryService');

describe('CountryService', () => {
  describe('getNbCountries()', () => {
    it('should return the number of countries', async () => {
      const result = await CountryService.getNbCountries();
      should.exist(result);
      should(result).have.property('count');
      should(result.count).be.a.String();
    });

    it('should return null on database error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      const result = await CountryService.getNbCountries();
      should(result).be.null();
      stub.restore();
    });

    it('should return null when no results', async () => {
      const stub = sinon.stub(CommonService, 'query').resolves({ rows: [] });
      const result = await CountryService.getNbCountries();
      should(result).be.null();
      stub.restore();
    });
  });

  describe('getEntranceCountsByCountry()', () => {
    it('returns every fixture country with an integer count', async () => {
      const result = await CountryService.getEntranceCountsByCountry();
      should(result.map((c) => c.id)).containDeep(['ES', 'FR', 'GB', 'US']);
      result.forEach((country) => {
        should(Number.isInteger(country.nb_entrances)).be.true();
      });
    });

    it('gives the same count as the country statistics', async () => {
      const result = await CountryService.getEntranceCountsByCountry();
      await Promise.all(
        ['ES', 'FR', 'GB', 'US'].map(async (countryId) => {
          const stats =
            await StatisticsCountryService.getNbEntrancesInCountry(countryId);
          should(Number.parseInt(stats.nb_entrances, 10)).equal(
            result.find((c) => c.id === countryId).nb_entrances
          );
        })
      );
    });

    it('rethrows a database error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      try {
        await should(
          CountryService.getEntranceCountsByCountry()
        ).be.rejectedWith('DB error');
      } finally {
        stub.restore();
      }
    });
  });
});
