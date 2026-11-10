const should = require('should');
const sinon = require('sinon');
const RegionService = require('../../../api/services/RegionService');
const CommonService = require('../../../api/services/CommonService');
const StatisticsRegionService = require('../../../api/services/StatisticsRegionService');

describe('RegionService', () => {
  describe('getNbRegionsByCountry()', () => {
    it('should return the number of regions for a country', async () => {
      const result = await RegionService.getNbRegionsByCountry('FR');
      should.exist(result);
      should(result).have.property('count');
    });

    it('should return null for invalid country', async () => {
      const result = await RegionService.getNbRegionsByCountry('XX');
      should.exist(result);
      should(result.count).equal('0');
    });

    it('should return null on database error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      const result = await RegionService.getNbRegionsByCountry('FR');
      should(result).be.null();
      stub.restore();
    });
  });

  describe('getEntranceCountsByCountry()', () => {
    it('returns the regions of the country only', async () => {
      const result = await RegionService.getEntranceCountsByCountry('FR');
      should(result.map((r) => r.id)).containEql('FR-01');
      result.forEach((region) => {
        should(region.id.startsWith('FR-')).be.true();
        should(Number.isInteger(region.nb_entrances)).be.true();
      });
    });

    it('returns an empty list for a country with no region', async () => {
      const result = await RegionService.getEntranceCountsByCountry('GB');
      should(result).eql([]);
    });

    it('gives the same count as the region statistics', async () => {
      const result = await RegionService.getEntranceCountsByCountry('FR');
      const stats =
        await StatisticsRegionService.getNbEntrancesInRegion('FR-01');
      should(Number.parseInt(stats.nb_entrances, 10)).equal(
        result.find((r) => r.id === 'FR-01').nb_entrances
      );
    });
  });
});
