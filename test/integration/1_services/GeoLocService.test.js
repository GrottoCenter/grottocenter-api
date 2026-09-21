const should = require('should');
const sinon = require('sinon');
const GeoLocService = require('../../../api/services/GeoLocService');
const computeBoundingBoxAreaKm2 = require('../../../api/utils/computeBoundingBoxAreaKm2');

describe('GeoLocService', () => {
  let req;

  beforeEach(() => {
    req = {
      param: sinon.stub(),
    };
  });

  describe('checkAndGetCoordinatesParams()', () => {
    it('should return error when parameters are missing', () => {
      req.param.returns(null);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).not.be.empty();
    });

    it('should return error when latitude is out of range', () => {
      req.param.withArgs('sw_lat').returns(-100);
      req.param.withArgs('sw_lng').returns(0);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('-90 & 90');
    });

    it('should return error when longitude is out of range', () => {
      req.param.withArgs('sw_lat').returns(40);
      req.param.withArgs('sw_lng').returns(-200);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('-180 & 180');
    });

    it('should return error when latitude is above 90', () => {
      req.param.withArgs('sw_lat').returns(40);
      req.param.withArgs('sw_lng').returns(0);
      req.param.withArgs('ne_lat').returns(95);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('-90 & 90');
    });

    it('should return error when longitude is above 180', () => {
      req.param.withArgs('sw_lat').returns(40);
      req.param.withArgs('sw_lng').returns(5);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(200);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('-180 & 180');
    });

    it('should return valid bounds when parameters are correct', () => {
      req.param.withArgs('sw_lat').returns(40);
      req.param.withArgs('sw_lng').returns(5);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).be.empty();
      should(result.southWestBound.lat).equal(40);
      should(result.southWestBound.lng).equal(5);
      should(result.northEastBound.lat).equal(45);
      should(result.northEastBound.lng).equal(10);
    });
  });

  describe('countEntrances()', () => {
    it('should count entrances in bounds', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const count = await GeoLocService.countEntrances(
        southWestBound,
        northEastBound
      );
      should(count).be.a.Number();
    });
  });

  describe('getEntrancesCoordinates()', () => {
    it('should get entrance coordinates in bounds', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const coords = await GeoLocService.getEntrancesCoordinates(
        southWestBound,
        northEastBound,
        100
      );
      should(coords).be.an.Array();
    });
  });

  describe('getNetworksCoordinates()', () => {
    it('should get network coordinates in bounds', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const coords = await GeoLocService.getNetworksCoordinates(
        southWestBound,
        northEastBound,
        100
      );
      should(coords).be.an.Array();
    });
  });

  describe('getEntrancesMap()', () => {
    it('should get entrances for map', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const entrances = await GeoLocService.getEntrancesMap(
        southWestBound,
        northEastBound,
        100
      );
      should(entrances).be.an.Array();
    });

    it('should return empty array for area with no entrances', async () => {
      const southWestBound = { lat: -89, lng: -179 };
      const northEastBound = { lat: -88, lng: -178 };
      const entrances = await GeoLocService.getEntrancesMap(
        southWestBound,
        northEastBound,
        100
      );
      should(entrances).be.an.Array();
      should(entrances.length).equal(0);
    });

    it('should include dataQuality field as an integer for each entrance', async () => {
      const southWestBound = { lat: 62, lng: 78 };
      const northEastBound = { lat: 63, lng: 79 };
      const entrances = await GeoLocService.getEntrancesMap(
        southWestBound,
        northEastBound,
        100
      );
      should(entrances).be.an.Array();
      should(entrances.length).be.above(0);
      entrances.forEach((entrance) => {
        should(entrance).have.property('dataQuality');
        should(entrance.dataQuality).be.a.Number();
        should(entrance.dataQuality % 1).equal(0);
        should(entrance.dataQuality).be.aboveOrEqual(0);
        should(entrance.dataQuality).be.belowOrEqual(100);
      });
    });
  });

  describe('getGrottosMap()', () => {
    it('should get grottos for map', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const grottos = await GeoLocService.getGrottosMap(
        southWestBound,
        northEastBound
      );
      should(grottos).be.an.Array();
    });
  });

  describe('getNetworksMap()', () => {
    it('should get networks for map with entrances array', async () => {
      // Cave 1 has entrances 1 (lat 62.8, lng 78.5) and 2 (lat 62.9, lng 78.6)
      const southWestBound = { lat: 60, lng: 75 };
      const northEastBound = { lat: 65, lng: 80 };
      const networks = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound
      );
      should(networks).be.an.Array();
      should(networks.length).be.greaterThan(0);

      const network = networks.find((n) => n.id === 1);
      should(network).not.be.undefined();
      should(network).have.property('id', 1);
      should(network).have.property('name');
      should(network).have.property('longitude');
      should(network).have.property('latitude');
      should(network).have.property('entrances');
      should(network.entrances).be.an.Array();
      should(network.entrances.length).be.greaterThan(1);

      for (const entrance of network.entrances) {
        should(entrance).have.property('id');
        should(entrance).have.property('name');
        should(entrance).have.property('latitude');
        should(entrance).have.property('longitude');
        should(entrance.id).be.a.Number();
        should(entrance.latitude).be.a.Number();
        should(entrance.longitude).be.a.Number();
      }
    });

    it('should compute centroid as average of entrance coordinates', async () => {
      const southWestBound = { lat: 60, lng: 75 };
      const northEastBound = { lat: 65, lng: 80 };
      const networks = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound
      );
      const network = networks.find((n) => n.id === 1);
      should(network).not.be.undefined();

      const avgLat =
        network.entrances.reduce((sum, e) => sum + e.latitude, 0) /
        network.entrances.length;
      const avgLng =
        network.entrances.reduce((sum, e) => sum + e.longitude, 0) /
        network.entrances.length;

      should(network.latitude).be.approximately(avgLat, 0.0001);
      should(network.longitude).be.approximately(avgLng, 0.0001);
    });

    it('should return empty array for area with no networks', async () => {
      const southWestBound = { lat: -89, lng: -179 };
      const northEastBound = { lat: -88, lng: -178 };
      const networks = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound
      );
      should(networks).be.an.Array();
      should(networks.length).equal(0);
    });
  });

  describe('getEntrancesCoordinates() edge cases', () => {
    it('should handle empty results', async () => {
      const southWestBound = { lat: -89, lng: -179 };
      const northEastBound = { lat: -88, lng: -178 };
      const coords = await GeoLocService.getEntrancesCoordinates(
        southWestBound,
        northEastBound,
        100
      );
      should(coords).be.an.Array();
    });
  });

  describe('getNetworksCoordinates() edge cases', () => {
    it('should handle empty results', async () => {
      const southWestBound = { lat: -89, lng: -179 };
      const northEastBound = { lat: -88, lng: -178 };
      const coords = await GeoLocService.getNetworksCoordinates(
        southWestBound,
        northEastBound,
        100
      );
      should(coords).be.an.Array();
    });
  });

  describe('checkAndGetCoordinatesParams() multiple errors', () => {
    it('should return multiple errors when both lat and lng are out of range', () => {
      req.param.withArgs('sw_lat').returns(-100);
      req.param.withArgs('sw_lng').returns(-200);
      req.param.withArgs('ne_lat').returns(95);
      req.param.withArgs('ne_lng').returns(200);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('-90 & 90');
      should(result.errorMessage).containEql('-180 & 180');
    });

    it('should return error for multiple missing parameters', () => {
      req.param.withArgs('sw_lat').returns(null);
      req.param.withArgs('sw_lng').returns(null);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).containEql('South west latitude');
      should(result.errorMessage).containEql('South west longitude');
    });

    it('should handle boundary values for latitude', () => {
      req.param.withArgs('sw_lat').returns(-90);
      req.param.withArgs('sw_lng').returns(0);
      req.param.withArgs('ne_lat').returns(90);
      req.param.withArgs('ne_lng').returns(10);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).be.empty();
    });

    it('should handle boundary values for longitude', () => {
      req.param.withArgs('sw_lat').returns(40);
      req.param.withArgs('sw_lng').returns(-180);
      req.param.withArgs('ne_lat').returns(45);
      req.param.withArgs('ne_lng').returns(180);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).be.empty();
    });

    // The area cap deliberately lives in validateBoundingBoxArea, not here: all
    // eight geoloc controllers call this function, and the web app requests
    // world bounds from four of the others on every map page load.
    it('should accept world bounds, leaving any size limit to the caller', () => {
      req.param.withArgs('sw_lat').returns(-90);
      req.param.withArgs('sw_lng').returns(-180);
      req.param.withArgs('ne_lat').returns(90);
      req.param.withArgs('ne_lng').returns(180);
      const result = GeoLocService.checkAndGetCoordinatesParams(req);
      should(result.errorMessage).be.empty();
    });
  });

  describe('validateBoundingBoxArea()', () => {
    // 2 x 2 degrees at 45N is ~34354 km², 2.1 x 2 is ~36072 km².
    const under = [
      { lat: 45, lng: 0 },
      { lat: 47, lng: 2 },
    ];
    const over = [
      { lat: 45, lng: 0 },
      { lat: 47, lng: 2.1 },
    ];

    let warn;

    beforeEach(() => {
      warn = sinon.stub(sails.log, 'warn');
    });

    afterEach(() => {
      warn.restore();
    });

    it('should accept a box under the limit', () => {
      should(GeoLocService.validateBoundingBoxArea(...under)).equal(null);
    });

    it('should reject a box over the limit', () => {
      const error = GeoLocService.validateBoundingBoxArea(...over);
      should(error).be.an.Object();
      should(error.code).equal('BBOX_AREA_EXCEEDED');
    });

    // The comparison is strictly greater-than, so a box sitting on the limit is
    // allowed through. Area is exactly linear in the longitude span, so scaling
    // a known box by limit/area lands on the limit to within one float rounding
    // step — close enough to prove there is no off-by-epsilon rejection at the
    // boundary, which is where every legitimate request near the cap will sit.
    it('should accept a box whose area sits on the limit', () => {
      const sw = { lat: 0, lng: 0 };
      const unitArea = computeBoundingBoxAreaKm2(sw, { lat: 1, lng: 1 });
      const ne = {
        lat: 1,
        lng: GeoLocService.MAX_BBOX_AREA_KM2 / unitArea,
      };

      const areaKm2 = computeBoundingBoxAreaKm2(sw, ne);
      should(Math.abs(areaKm2 - GeoLocService.MAX_BBOX_AREA_KM2)).be.below(
        1e-6
      );
      should(GeoLocService.validateBoundingBoxArea(sw, ne)).equal(null);
    });

    it('should reject world bounds', () => {
      const error = GeoLocService.validateBoundingBoxArea(
        { lat: -90, lng: -180 },
        { lat: 90, lng: 180 }
      );
      should(error.code).equal('BBOX_AREA_EXCEEDED');
    });

    it('should name the limit and the alternative endpoint in the message', () => {
      const error = GeoLocService.validateBoundingBoxArea(...over);
      should(error.message).match(
        /exceeds the maximum allowed size of 35000 km²/
      );
      should(error.message).match(/entrancesCoordinates/);
    });

    it('should log a warning once when it rejects', () => {
      GeoLocService.validateBoundingBoxArea(...over);
      should(warn.calledOnce).be.true();
      should(warn.firstCall.args[0]).match(/Bounding box area cap exceeded/);
    });

    it('should not log when it accepts', () => {
      GeoLocService.validateBoundingBoxArea(...under);
      should(warn.called).be.false();
    });

    // Not this function's job: coordinates that are not numbers are left to
    // fail where they already do, rather than being reported as an area
    // problem. See the comment in validateBoundingBoxArea.
    it('should pass non-numeric coordinates through without an area error', () => {
      should(
        GeoLocService.validateBoundingBoxArea(
          { lat: 'abc', lng: 0 },
          { lat: 47, lng: 2 }
        )
      ).equal(null);
      should(warn.called).be.false();
    });

    it('should expose the limit and the error code', () => {
      should(GeoLocService.MAX_BBOX_AREA_KM2).equal(35000);
      should(GeoLocService.BBOX_AREA_EXCEEDED).equal('BBOX_AREA_EXCEEDED');
    });
  });
});
