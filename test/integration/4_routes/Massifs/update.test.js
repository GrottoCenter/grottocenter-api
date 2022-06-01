const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');
const MassifService = require('../../../../api/services/MassifService');

describe('Massif features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('update', () => {
    it('should return 404 ', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/massifs/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200', (done) => {
      const update = {
        id: 1,
        descriptions: [3],
        documents: [2, 3],
        geogPolygon: massifPolygon.geoJson2,
        names: [3],
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/massifs/1')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);

          const massifUpdated = await TMassif.findOne(1)
            .populate('names')
            .populate('descriptions')
            .populate('documents');
          massifUpdated.caves = await MassifService.getCaves(1);

          should(massifUpdated.descriptions).containDeep([{ id: 3 }]);
          should(massifUpdated.documents).containDeep([{ id: 2 }, { id: 3 }]);
          should(massifUpdated.geogPolygon).equal(massifPolygon.geoJson2ToWKB);
          should(massifUpdated.names).containDeep([{ id: 3 }]);
          return done();
        });
    });
  });
});
