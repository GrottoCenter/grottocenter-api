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
  });
});
