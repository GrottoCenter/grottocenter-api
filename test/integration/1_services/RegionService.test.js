const should = require('should');
const sinon = require('sinon');
const RegionService = require('../../../api/services/RegionService');
const CommonService = require('../../../api/services/CommonService');

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
});
