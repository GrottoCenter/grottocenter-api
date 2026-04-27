const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif preview-sensitive route features', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('GET /api/v1/massifs/:id/preview-sensitive', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return 403 for user', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1/preview-sensitive')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/987654321/preview-sensitive')
        .set('Authorization', adminToken)
        .expect(404, done);
    });

    it('should return 200 and a count for admin', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/100/preview-sensitive')
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          should(res.body).have.property('count', 0);
        })
        .end(done);
    });
  });
});
