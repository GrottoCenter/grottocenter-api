const should = require('should');
const sinon = require('sinon');
const GeoLocService = require('../../../api/services/GeoLocService');

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
    it('should get networks for map', async () => {
      const southWestBound = { lat: 40, lng: 5 };
      const northEastBound = { lat: 50, lng: 10 };
      const networks = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound
      );
      should(networks).be.an.Array();
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
  });
});
