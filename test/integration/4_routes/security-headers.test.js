const request = require('supertest');
const should = require('should');

describe('Security headers middleware', () => {
  let response;

  before(async () => {
    response = await request(sails.hooks.http.app).get('/api/v1/swagger.yaml');
  });

  it('should include Strict-Transport-Security header', () => {
    should(response.headers).have.property('strict-transport-security');
    should(response.headers['strict-transport-security']).equal(
      'max-age=31536000; includeSubDomains'
    );
  });

  it('should include X-Content-Type-Options header', () => {
    should(response.headers).have.property('x-content-type-options');
    should(response.headers['x-content-type-options']).equal('nosniff');
  });

  it('should include X-Frame-Options header', () => {
    should(response.headers).have.property('x-frame-options');
    should(response.headers['x-frame-options']).equal('DENY');
  });

  it('should not include X-Powered-By header', () => {
    should(response.headers).not.have.property('x-powered-by');
  });
});

describe('Auth body size limit middleware', () => {
  it('should reject oversized body on POST /api/v1/login', async () => {
    // Generate a payload larger than 1 KB
    const largePayload = {
      email: 'test@example.com',
      password: 'x'.repeat(2000),
    };

    const response = await request(sails.hooks.http.app)
      .post('/api/v1/login')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    should(response.status).equal(413);
    should(response.body).have.property('message');
  });

  it('should reject oversized body on POST /api/v1/signup', async () => {
    const largePayload = {
      email: 'test@example.com',
      password: 'x'.repeat(2000),
      nickname: 'testuser',
    };

    const response = await request(sails.hooks.http.app)
      .post('/api/v1/signup')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    should(response.status).equal(413);
    should(response.body).have.property('message');
  });

  it('should reject oversized body on POST /api/v1/forgotPassword', async () => {
    const largePayload = {
      email: `${'x'.repeat(2000)}@example.com`,
    };

    const response = await request(sails.hooks.http.app)
      .post('/api/v1/forgotPassword')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    should(response.status).equal(413);
    should(response.body).have.property('message');
  });

  it('should allow normal-sized body on POST /api/v1/login', async () => {
    const normalPayload = {
      email: 'test@example.com',
      password: 'ValidPass123!',
    };

    const response = await request(sails.hooks.http.app)
      .post('/api/v1/login')
      .set('Content-Type', 'application/json')
      .send(normalPayload);

    // Should not be 413 — it may be 401 (invalid credentials) but not payload-too-large
    should(response.status).not.equal(413);
  });

  it('should not apply body limit to non-auth endpoints', async () => {
    // A large body on a non-auth endpoint should not be rejected with 413
    const largePayload = { data: 'x'.repeat(2000) };

    const response = await request(sails.hooks.http.app)
      .get('/api/v1/swagger.yaml')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    should(response.status).not.equal(413);
  });
});
