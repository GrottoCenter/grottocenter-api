const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const CAVER_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'documents',
  'exploredEntrances',
  'organizations',
  'groups',
  'language',
  'name',
  'nickname',
  'subscribedToCountries',
  'subscribedToMassifs',
  'surname',
];

describe('Caver features', () => {
  let userToken;
  let adminToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
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
        .get('/api/v1/cavers/3')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: caver } = res;
          should(caver).have.properties(CAVER_PROPERTIES);
          should(caver.nickname).not.be.empty();
          caver.documents.forEach((document) => {
            should(document).have.properties('descriptions');
          });
          caver.exploredEntrances.forEach((entrance) => {
            should(entrance).have.properties('names');
          });
          caver.organizations.forEach((organization) => {
            should(organization).have.properties('names');
          });
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
          should(caver).have.properties(CAVER_PROPERTIES);
          should(caver.nickname).not.be.empty();
          caver.documents.forEach((document) => {
            should(document).have.properties('description');
          });
          caver.exploredEntrances.forEach((entrance) => {
            should(entrance).have.properties('name');
          });
          caver.organizations.forEach((organization) => {
            should(organization).have.properties('name');
          });
          return done();
        });
    });
  });
});
