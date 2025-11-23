const should = require('should');
const sinon = require('sinon');
const MassifService = require('../../../api/services/MassifService');
const CommonService = require('../../../api/services/CommonService');
const SearchService = require('../../../api/services/SearchService');
const massifPolygon = require('../4_routes/Massifs/FAKE_DATA');

describe('MassifService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getCaves', () => {
    it('should get the caves inside the geogPolygon of a massif', async () => {
      const caves = await MassifService.getCaves(1);
      should(caves).containDeep([{ id: 3 }, { id: 5 }]);
    });

    it('should return empty array on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      const caves = await MassifService.getCaves(999);
      should(caves).eql([]);
    });
  });

  describe('geoJsonToWKT', () => {
    it('should convert a geoJson into WKT', async () => {
      const geogPolygon = massifPolygon.geoJson1;
      const res = await MassifService.geoJsonToWKT(geogPolygon);
      should(res).equal(massifPolygon.geoJson1ToWKT);
    });
  });
  describe('wktToGeoJson', () => {
    it('should convert a WKT into geoJson', async () => {
      const geometry = massifPolygon.geoJson1ToWKT;
      const res = await MassifService.wktToGeoJson(geometry);
      should(res).equal(massifPolygon.geoJson1ToString);
    });
  });

  describe('deleteInSearch', () => {
    it('should delete massif from search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const deleteStub = sinon.stub(SearchService, 'deleteDocument').resolves();

      await MassifService.deleteInSearch(123);

      should(deleteStub.calledOnce).be.true();
      should(deleteStub.calledWith('massifs', 123)).be.true();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getEntrances', () => {
    it('should return empty array on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      const entrances = await MassifService.getEntrances(999);
      should(entrances).eql([]);
    });
  });

  describe('getNetworks', () => {
    it('should return empty array on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      const networks = await MassifService.getNetworks(999);
      should(networks).eql([]);
    });
  });
});
