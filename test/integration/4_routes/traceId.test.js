const request = require('supertest');
const should = require('should');

describe('Trace ID middleware', () => {
  it('should add X-Trace-Id header to response', async () => {
    const response = await request(sails.hooks.http.app).get(
      '/api/v1/swagger.yaml'
    );

    should(response.headers).have.property('x-trace-id');
    should(response.headers['x-trace-id']).be.a.String();
    should(response.headers['x-trace-id']).have.length(36);
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
});
