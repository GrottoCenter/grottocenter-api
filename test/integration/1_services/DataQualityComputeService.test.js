const should = require('should');
const sinon = require('sinon');
const DataQualityComputeService = require('../../../api/services/DataQualityComputeService');
const CommonService = require('../../../api/services/CommonService');

describe('DataQualityComputeService', () => {
  describe('getEntrancesWithQualityByMassif', () => {
    it('should return array for massif with pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassif(
          1,
          10,
          0
        );
      should(Array.isArray(result)).be.true();
      result.length.should.be.greaterThan(0);
      result[0].should.have.property('id_entrance');
      result[0].should.have.property('id_massif', 1);
    });

    it('should return array for massif without pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassif(1);
      should(Array.isArray(result)).be.true();
      result.length.should.equal(2);
    });

    it('should return empty array when no results', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassif(999);
      should(Array.isArray(result)).be.true();
      result.length.should.equal(0);
    });

    it('should return null on error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassif(1);
      should(result).be.null();
      stub.restore();
    });
  });

  describe('getEntrancesWithQualityByMassifCount', () => {
    it('should return count for massif 1 (2 entrances)', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassifCount(1);
      should(typeof result).equal('number');
      result.should.equal(2);
    });

    it('should return count for massif 2 (1 entrance)', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassifCount(2);
      should(typeof result).equal('number');
      result.should.equal(1);
    });

    it('should return 0 on error', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByMassifCount(
          null
        );
      should(result).equal(0);
    });
  });

  describe('getEntrancesWithQualityByCountry', () => {
    it('should return array for country with pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountry(
          'FR',
          10,
          0
        );
      should(Array.isArray(result)).be.true();
      result.length.should.be.greaterThan(0);
      result[0].should.have.property('id_entrance');
      result[0].should.have.property('id_country', 'FR');
    });

    it('should return array for country without pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountry('FR');
      should(Array.isArray(result)).be.true();
      result.length.should.equal(3);
    });

    it('should return empty array when no results', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountry('XX');
      should(Array.isArray(result)).be.true();
      result.length.should.equal(0);
    });

    it('should return null on error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountry('FR');
      should(result).be.null();
      stub.restore();
    });
  });

  describe('getEntrancesWithQualityByCountryCount', () => {
    it('should return count for country FR (3 entrances)', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountryCount(
          'FR'
        );
      should(typeof result).equal('number');
      result.should.equal(3);
    });

    it('should return 0 on error', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByCountryCount(
          null
        );
      should(result).equal(0);
    });
  });

  describe('getEntrancesWithQualityByRegion', () => {
    it('should return array for region with pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegion(
          'FR-01',
          10,
          0
        );
      should(Array.isArray(result)).be.true();
    });

    it('should return array for region without pagination', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegion(
          'FR-01'
        );
      should(Array.isArray(result)).be.true();
    });

    it('should return empty array when no results', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegion(
          'XX-XX'
        );
      should(Array.isArray(result)).be.true();
      result.length.should.equal(0);
    });

    it('should return null on error', async () => {
      const stub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB error'));
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegion(
          'FR-01'
        );
      should(result).be.null();
      stub.restore();
    });
  });

  describe('getEntrancesWithQualityByRegionCount', () => {
    it('should return count for region', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegionCount(
          'FR-01'
        );
      should(typeof result).equal('number');
      should(result).greaterThanOrEqual(0);
    });

    it('should return 0 on error', async () => {
      const result =
        await DataQualityComputeService.getEntrancesWithQualityByRegionCount(
          null
        );
      should(result).equal(0);
    });
  });
});
