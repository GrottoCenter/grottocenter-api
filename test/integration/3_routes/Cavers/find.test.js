const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const CAVER_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'documents',
  'groups',
  'name',
  'nickname',
  'surname',
];

describe('Caver features', () => {
  let userToken;
  let adminToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
    sails.log.info('Asking for admin auth token...');
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('find()', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/987654321')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200 and a caver partial view', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: caver } = res;
          should(caver).have.properties(CAVER_PROPERTIES);
          should(caver.nickname).not.be.empty();
          return done();
        });
    });
    it('should return code 200 and a caver complete view', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/1')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: caver } = res;
          sails.log.error(caver);
          should(caver).have.properties(CAVER_PROPERTIES);
          should(caver.nickname).not.be.empty();
          return done();
        });
    });
  });
});
