const supertest = require('supertest');
const should = require('should');
const jwt = require('jsonwebtoken');
const TokenService = require('../../../../api/services/TokenService');

describe('POST /api/v1/sso/auth-token', () => {
  let authToken;
  const testSalt = 'integration-test-superset-salt';
  const documentsSalt = 'integration-test-documents-salt';

  before(() => {
    // Issue a valid GC auth token for an existing caver fixture
    authToken = TokenService.issue(
      { id: 1, groups: [], nickname: 'TestCaver' },
      3600,
      'Authentication'
    );
    process.env.SSO_SALT_SUPERSET = testSalt;
    process.env.SSO_SALT_DOCUMENTS = documentsSalt;
  });

  after(() => {
    delete process.env.SSO_SALT_SUPERSET;
    delete process.env.SSO_SALT_DOCUMENTS;
  });

  describe('Happy path', () => {
    it('should return 200 with a valid JWT for product "superset"', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ product: 'superset' })
        .expect(200);

      should(res.body).have.property('token');
      should(res.body.token).be.a.String();

      // Verify the SSO token structure
      const decoded = jwt.verify(res.body.token, testSalt);
      should(decoded.sub).equal(1);
      should(decoded.aud).equal('superset');
      should(decoded.email).equal('1@grottocenter.org');
      should(decoded).have.property('firstName');
      should(decoded).have.property('lastName');
      should(decoded).have.property('jti');
      should(decoded.exp - decoded.iat).equal(30);
    });
  });

  describe('Documents product', () => {
    it('should return 200 with a JWT for product "documents" signed with its own secret', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ product: 'documents' })
        .expect(200);

      const decoded = jwt.verify(res.body.token, documentsSalt, {
        audience: 'documents',
        algorithms: ['HS256'],
      });
      should(decoded.sub).equal(1);
      should(decoded.aud).equal('documents');
      should(decoded).have.property('jti');
      should(decoded.exp - decoded.iat).equal(30);

      // The Superset secret must not be able to verify a documents token
      should(() => jwt.verify(res.body.token, testSalt)).throw(
        /invalid signature/
      );
    });

    it('should return 500 for "documents" when SSO_SALT_DOCUMENTS is not configured', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      delete process.env.SSO_SALT_DOCUMENTS;

      try {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/sso/auth-token')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send({ product: 'documents' })
          .expect(500);

        should(res.body).be.an.Object();
      } finally {
        process.env.SSO_SALT_DOCUMENTS = documentsSalt;
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when product field is missing', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({})
        .expect(400);

      should(res.body).be.an.Object();
    });

    it('should return 400 when product is empty string', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ product: '' })
        .expect(400);

      should(res.body).be.an.Object();
    });

    it('should return 400 for unsupported product', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ product: 'unknown_product' })
        .expect(400);

      should(res.body).be.an.Object();
    });
  });

  describe('Authentication errors', () => {
    it('should return 401 without bearer token', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Content-Type', 'application/json')
        .send({ product: 'superset' })
        .expect(401);
    });

    it('should return 401 with invalid bearer token', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', 'Bearer invalid.token.here')
        .set('Content-Type', 'application/json')
        .send({ product: 'superset' })
        .expect(401);
    });
  });

  describe('Configuration errors', () => {
    it('should return 500 when salt env var is not configured', async () => {
      const originalSalt = process.env.SSO_SALT_SUPERSET;
      delete process.env.SSO_SALT_SUPERSET;

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/sso/auth-token')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ product: 'superset' })
        .expect(500);

      should(res.body).be.an.Object();

      // Restore
      process.env.SSO_SALT_SUPERSET = originalSalt;
    });
  });
});
