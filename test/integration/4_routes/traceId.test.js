const request = require('supertest');
const should = require('should');

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('Trace ID middleware', () => {
  it('should add X-Trace-Id header to response', async () => {
    const response = await request(sails.hooks.http.app).get(
      '/api/v1/swagger.yaml'
    );

    should(response.headers).have.property('x-trace-id');
    should(response.headers['x-trace-id']).be.a.String();
    should(response.headers['x-trace-id']).have.length(36);
    should(response.headers['x-trace-id']).match(UUID_V7);
  });

  it('should generate unique trace IDs for concurrent requests', async () => {
    const requests = Array(5)
      .fill()
      .map(() => request(sails.hooks.http.app).get('/api/v1/swagger.yaml'));

    const responses = await Promise.all(requests);
    const traceIds = responses.map((r) => r.headers['x-trace-id']);

    const uniqueIds = new Set(traceIds);
    should(uniqueIds.size).equal(5);
  });

  it('should accept and propagate X-Trace-Id from request', async () => {
    const clientTraceId = '01932e9e-1234-7000-8000-abcdef123456';
    const response = await request(sails.hooks.http.app)
      .get('/api/v1/swagger.yaml')
      .set('X-Trace-Id', clientTraceId);

    should(response.headers['x-trace-id']).equal(clientTraceId);
  });

  it('should generate new trace ID if not provided', async () => {
    const response = await request(sails.hooks.http.app).get(
      '/api/v1/swagger.yaml'
    );

    should(response.headers).have.property('x-trace-id');
    should(response.headers['x-trace-id']).have.length(36);
  });

  it('should keep a valid X-Trace-Id that is not a UUID v7', async () => {
    const clientTraceId = '3b241101-e2bb-4255-8caf-4136c566a962';
    const response = await request(sails.hooks.http.app)
      .get('/api/v1/swagger.yaml')
      .set('X-Trace-Id', clientTraceId);

    should(response.headers['x-trace-id']).equal(clientTraceId);
  });

  it('should lower-case an upper-case X-Trace-Id', async () => {
    const response = await request(sails.hooks.http.app)
      .get('/api/v1/swagger.yaml')
      .set('X-Trace-Id', '3B241101-E2BB-4255-8CAF-4136C566A962');

    should(response.headers['x-trace-id']).equal(
      '3b241101-e2bb-4255-8caf-4136c566a962'
    );
  });

  [
    ['nil', '00000000-0000-0000-0000-000000000000'],
    ['max', 'ffffffff-ffff-ffff-ffff-ffffffffffff'],
  ].forEach(([name, value]) => {
    it(`should replace the ${name} UUID used as X-Trace-Id`, async () => {
      const response = await request(sails.hooks.http.app)
        .get('/api/v1/swagger.yaml')
        .set('X-Trace-Id', value);

      should(response.headers['x-trace-id']).not.equal(value);
      should(response.headers['x-trace-id']).have.length(36);
    });
  });

  it('should replace an X-Trace-Id that is not a UUID', async () => {
    const response = await request(sails.hooks.http.app)
      .get('/api/v1/swagger.yaml')
      .set('X-Trace-Id', 'not-a-uuid <script>');

    should(response.headers['x-trace-id']).not.equal('not-a-uuid <script>');
    should(response.headers['x-trace-id']).match(UUID_V7);
  });

  describe('CORS', () => {
    it('should allow x-trace-id in the preflight answer', async () => {
      const response = await request(sails.hooks.http.app)
        .options('/api/v1/swagger.yaml')
        .set('Origin', 'https://www.grottocenter.org')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-trace-id');

      should(response.headers['access-control-allow-headers']).containEql(
        'x-trace-id'
      );
    });

    it('should expose X-Trace-Id on a cross-origin response', async () => {
      const response = await request(sails.hooks.http.app)
        .get('/api/v1/swagger.yaml')
        .set('Origin', 'https://www.grottocenter.org');

      should(response.headers['access-control-expose-headers']).containEql(
        'X-Trace-Id'
      );
    });
  });
});
