const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('Get admins', () => {
    let userToken;
    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    it('should return list of administrators', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/admins')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('cavers');
          should(res.body.cavers).be.an.Array();
          should(res.body.cavers.length).be.greaterThan(0);
          return done();
        });
    });

    it('should return 401 without authentication', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/admins')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });
});
