const should = require('should');
const LocationService = require('../../../api/services/LocationService');

const LOCATION_PROPERTIES = [
  'author',
  'body',
  'dateInscription',
  'dateReviewed',
  'entrance',
  'id',
  'language',
  'relevance',
  'reviewer',
  'title',
];

describe('LocationService', () => {
  describe('getEntranceLocations()', () => {
    it('should get the entrance locations', async () => {
      const locations = await LocationService.getEntranceLocations(1);
      should(locations).have.length(2);
      for (const location of locations) {
        should(location).have.properties(LOCATION_PROPERTIES);
        should(location.id).not.be.undefined();
        should(location.body).not.be.empty();
        should(location.entrance).not.be.undefined();
      }
    });

    it('should return empty array when entranceId is null', async () => {
      const locations = await LocationService.getEntranceLocations(null);
      should(locations).be.an.Array();
      should(locations.length).equal(0);
    });
  });

  describe('getEntranceHLocations()', () => {
    it('should return empty array when entranceId is null', async () => {
      const locations = await LocationService.getEntranceHLocations(
        null,
        false
      );
      should(locations).be.an.Array();
      should(locations.length).equal(0);
    });

    it('should get historical locations for entrance', async () => {
      const locations = await LocationService.getEntranceHLocations(1, true);
      should(locations).be.an.Array();
    });
  });

  describe('getLocation()', () => {
    it('should get a location by id', async () => {
      const location = await LocationService.getLocation(1);
      should.exist(location);
      should.exist(location.author);
    });
  });

  describe('getHLocation()', () => {
    it('should get historical locations by id with admin rights', async () => {
      const locations = await LocationService.getHLocation(1, true);
      should(locations).be.an.Array();
    });

    it('should return empty array for sensitive entrance without admin rights', async () => {
      const locations = await LocationService.getHLocation(1, false);
      should(locations).be.an.Array();
    });

    it('should handle array of location ids', async () => {
      const locations = await LocationService.getHLocation([1, 2], true);
      should(locations).be.an.Array();
    });
  });
});
