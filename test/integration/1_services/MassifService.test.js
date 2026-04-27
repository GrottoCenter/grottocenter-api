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

  describe('computePolygonAreaKm2', () => {
    it('should return a positive area for a known polygon', async () => {
      const wkt = await MassifService.geoJsonToWKT(massifPolygon.geoJson1);
      const area = await MassifService.computePolygonAreaKm2(wkt);
      area.should.be.above(0);
      area.should.be.a.Number();
    });

    it('should return total area equal to sum of parts for a MULTIPOLYGON', async () => {
      // geoJson1 is a MULTIPOLYGON with 2 parts
      const part1 = {
        type: 'Polygon',
        coordinates: massifPolygon.geoJson1.coordinates[0],
      };
      const part2 = {
        type: 'Polygon',
        coordinates: massifPolygon.geoJson1.coordinates[1],
      };

      const wktFull = await MassifService.geoJsonToWKT(massifPolygon.geoJson1);
      const wktPart1 = await MassifService.geoJsonToWKT(part1);
      const wktPart2 = await MassifService.geoJsonToWKT(part2);

      const areaFull = await MassifService.computePolygonAreaKm2(wktFull);
      const areaPart1 = await MassifService.computePolygonAreaKm2(wktPart1);
      const areaPart2 = await MassifService.computePolygonAreaKm2(wktPart2);

      const sumOfParts = areaPart1 + areaPart2;
      areaFull.should.be.approximately(sumOfParts, 0.01);
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

  describe('countEntrances', () => {
    it('should throw on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      await MassifService.countEntrances(999).should.be.rejectedWith(
        'DB Error'
      );
    });
  });

  describe('countUnsensitiveEntrances', () => {
    it('should throw on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      await MassifService.countUnsensitiveEntrances(999).should.be.rejectedWith(
        'DB Error'
      );
    });
  });

  describe('isPointInSensitiveMassif', () => {
    it('should throw on database error', async () => {
      sinon.stub(CommonService, 'query').rejects(new Error('DB Error'));
      await MassifService.isPointInSensitiveMassif(0, 0).should.be.rejectedWith(
        'DB Error'
      );
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
