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

  describe('validatePolygon', () => {
    it('should accept a polygon away from the antimeridian', async () => {
      const wkt = await MassifService.geoJsonToWKT(massifPolygon.geoJsonSmall);
      should(await MassifService.validatePolygon(wkt)).be.null();
    });

    it('should reject a polygon straddling the antimeridian', async () => {
      const wkt = await MassifService.geoJsonToWKT(
        massifPolygon.geoJsonCrossesAntimeridian
      );
      const error = await MassifService.validatePolygon(wkt);
      should(error).not.be.null();
      should(error.code).equal('POLYGON_CROSSES_ANTIMERIDIAN');
      should(error.message).match(/180° meridian/);
    });

    it('should reject a polygon spanning more than 180° of longitude', async () => {
      const wkt = await MassifService.geoJsonToWKT(
        massifPolygon.geoJsonWideLongitudeSpan
      );
      const error = await MassifService.validatePolygon(wkt);
      should(error).not.be.null();
      should(error.code).equal('POLYGON_CROSSES_ANTIMERIDIAN');
    });

    // The point of the check: a polygon it lets through cannot be one where the
    // && pre-filter and ST_Contains disagree, because the geodetic bounding box
    // is then a superset of the planar one. See #1811.
    it('should only accept polygons where the bbox pre-filter agrees with ST_Contains', async () => {
      const accepted = await MassifService.geoJsonToWKT(
        massifPolygon.geoJsonSmall
      );
      const rejected = await MassifService.geoJsonToWKT(
        massifPolygon.geoJsonCrossesAntimeridian
      );
      const geodeticBoxCoversPlanar = (wkt) =>
        `ST_Covers(Box2D(${wkt}::geometry::geography::geometry)::geometry,
                   Box2D(${wkt}::geometry)::geometry)`;
      const { rows } = await CommonService.query(
        `SELECT ${geodeticBoxCoversPlanar('$1')} AS accepted_holds,
                ${geodeticBoxCoversPlanar('$2')} AS rejected_holds`,
        [accepted, rejected]
      );
      should(rows[0].accepted_holds).be.true();
      should(rows[0].rejected_holds).be.false();
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
