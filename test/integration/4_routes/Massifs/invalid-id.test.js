const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const ROUTES = [
  ['get', '/api/v1/massifs/abc'],
  ['put', '/api/v1/massifs/abc'],
  ['delete', '/api/v1/massifs/abc'],
  ['post', '/api/v1/massifs/abc/restore'],
  ['post', '/api/v1/massifs/abc/subscribe'],
  ['post', '/api/v1/massifs/abc/unsubscribe'],
  ['get', '/api/v1/massifs/abc/statistics'],
  ['post', '/api/v1/massifs/abc/mark-sensitive'],
  ['post', '/api/v1/massifs/abc/unmark-sensitive'],
  ['get', '/api/v1/massifs/abc/preview-sensitive'],
  ['put', '/api/v1/massifs/abc/documents/1'],
  ['delete', '/api/v1/massifs/abc/documents/1'],
];

describe('Massif routes with a non-numeric id', () => {
  let adminToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  ROUTES.forEach(([method, url]) => {
    it(`${method.toUpperCase()} ${url} should return 404`, async () => {
      await supertest(sails.hooks.http.app)
        [method](url)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(404);
    });
  });
});
