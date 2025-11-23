const should = require('should');
const ConvertService = require('../../../api/services/ConvertService');

describe('ConvertService', () => {
  describe('findAllProj()', () => {
    it('should return all projections', async () => {
      const result = await ConvertService.findAllProj();
      should.exist(result);
      should.exist(result.rows);
      should(result.rows).be.an.Array();
    });
  });
});
