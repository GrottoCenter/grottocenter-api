const should = require('should');
const service = require('../../../api/services/BibliographicMetadataService');

describe('BibliographicMetadataService', () => {
  describe('getMetadata', () => {
    it('should return a single record by id', async () => {
      const record = await service.getMetadata(1);
      record.should.be.an.Object();
      record.id.should.be.equal(1);
    });

    it('should return null for unknown id', async () => {
      const record = await service.getMetadata(999999);
      should(record == null).be.true();
    });
  });

  describe('getOAIRecordsPaginated', () => {
    it('should return paginated records', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 10,
        offset: 0,
      });
      result.records.should.be.an.Array();
      result.records.length.should.be.belowOrEqual(10);
      result.total.should.be.a.Number();
      result.limit.should.equal(10);
      result.offset.should.equal(0);
    });
  });

  describe('getOAIIdentifiersPaginated', () => {
    it('should return paginated identifiers', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: 5,
        offset: 0,
      });
      result.identifiers.should.be.an.Array();
      result.identifiers.length.should.be.belowOrEqual(5);
      result.total.should.be.a.Number();
      result.limit.should.equal(5);
      result.offset.should.equal(0);
    });
  });

  describe('getDistinctSets', () => {
    it('should return an array of sets', async () => {
      const sets = await service.getDistinctSets();
      sets.should.be.an.Array();
      sets.forEach((s) => s.should.be.a.String());
    });
  });
});
