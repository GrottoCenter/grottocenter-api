const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Notifications features', () => {
  let adminToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Count unread', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/notifications/unread/count')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.have.properties(['count']);
          return done();
        });
    });
  });
});
