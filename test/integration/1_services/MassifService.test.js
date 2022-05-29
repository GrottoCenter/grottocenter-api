const should = require('should');
const MassifService = require('../../../api/services/MassifService');
const massifPolygon = require('../3_routes/Massifs/FAKE_DATA');

describe('MassifService', () => {
  describe('getCaves', () => {
    it('should get the caves inside the geogPolygon of a massif', async () => {
      const caves = await MassifService.getCaves(1);
      should(caves.length).equal(2);
      should(caves).containDeep([{ id: 3 }, { id: 5 }]);
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
});
