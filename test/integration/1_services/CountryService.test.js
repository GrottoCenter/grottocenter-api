const should = require('should');
const sinon = require('sinon');
const CountryService = require('../../../api/services/CountryService');
const CommonService = require('../../../api/services/CommonService');

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
});
