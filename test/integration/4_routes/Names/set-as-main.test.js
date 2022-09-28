const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Name features', () => {
  let userToken;
  const nameId = 13;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Set as main', () => {
    it('should return 404 on inexsisting name', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/names/123456789/setAsMain')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200 on setting one name as main and the other ones to false', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/names/${nameId}/setAsMain`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          const updatedName = await TName.findOne(nameId);
          const otherEntranceNames = await TName.find({
            entrance: updatedName.entrance,
          });
          for (const name of otherEntranceNames) {
            if (name.id === nameId) {
              should(name.isMain).be.true();
            } else {
              should(name.isMain).be.false();
            }
          }
          return done();
        });
    });
  });
});
