const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization find-all', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('GET /api/v1/organizations', () => {
    it('should return 206 with organizations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('organizations');
          should(res.body.organizations).be.an.Array();
          // https://github.com/GrottoCenter/grottocenter-api/issues/1806
          const first = res.body.organizations.find((o) => o.id === 1);
          should(first).have.property('type', 'SPELEOLOGY');
          return done();
        });
    });

    it('should list deleted organizations for moderators', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations')
        .query({ isDeleted: 'true' })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect((res) => {
          if (![200, 206].includes(res.status)) throw new Error(res.status);
        });
    });
  });
});
