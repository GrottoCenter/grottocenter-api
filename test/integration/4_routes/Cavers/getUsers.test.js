/* getUsers.test.js */

const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let userToken;
  let adminToken;
  let moderatorToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  it('should return all users with adminToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users')
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.be.an.Array().and.have.lengthOf(7);
        return done();
      });
  });

  it('should return all users with moderatorToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users')
      .set('Authorization', moderatorToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.be.an.Array().and.have.lengthOf(7);
        return done();
      });
  });

  it('should return all users with userToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users')
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.deepEqual({
          message: 'You are not authorized to access this endpoint',
        });
        return done();
      });
  });
});
