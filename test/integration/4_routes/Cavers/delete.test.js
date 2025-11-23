const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let moderatorToken;
  let adminToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 404 when caver does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/999999')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 403 when trying to delete default deleted caver', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/8')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should delete an author as moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/5')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should return 403 when moderator tries to delete a caver with password', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/6')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should delete a caver with password as admin', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/101')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });
  });
});
