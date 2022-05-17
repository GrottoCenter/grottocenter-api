const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');

describe('Massif features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
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
        caves: [1, 2],
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
            .populate('caves')
            .populate('names')
            .populate('descriptions')
            .populate('documents');

          should(massifUpdated.caves).containDeep([{ id: 1 }, { id: 2 }]);
          should(massifUpdated.descriptions).containDeep([{ id: 3 }]);
          should(massifUpdated.documents).containDeep([{ id: 2 }, { id: 3 }]);
          should(massifUpdated.geogPolygon).equal(massifPolygon.geoJson2ToWKT);
          should(massifUpdated.names).containDeep([{ id: 3 }]);
          return done();
        });
    });

    describe('Only authorized field should be updated', () => {
      it('should raise an error if changes are requested on unauthorized fields', (done) => {
        const newRandomField = 'random';
        const update = {
          randomField: newRandomField,
        };
        supertest(sails.hooks.http.app)
          .put('/api/v1/massifs/1')
          .send(update)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
  });
});
