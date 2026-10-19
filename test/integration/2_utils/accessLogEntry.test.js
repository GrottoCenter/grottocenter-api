const should = require('should');
const accessLogEntry = require('../../../api/utils/accessLogEntry');

const OUTCOME = { status: 200, durationMs: 12 };

const buildReq = (overrides = {}) => ({
  method: 'GET',
  path: '/api/v1/entrances/1',
  url: '/api/v1/entrances/1?lang=fr',
  ip: '37.58.156.218:10308',
  headers: {},
  ...overrides,
});

describe('accessLogEntry', () => {
  it('should carry the method, path, status and duration', () => {
    const entry = accessLogEntry(buildReq({ method: 'POST' }), {
      status: 201,
      durationMs: 42,
    });
    should(entry).containDeep({
      method: 'POST',
      path: '/api/v1/entrances/1',
      status: 201,
      durationMs: 42,
    });
  });

  it('should leave the query string out of the path', () => {
    const entry = accessLogEntry(
      buildReq({ path: undefined, url: '/api/v1/geoloc?sw_lat=45.5' }),
      OUTCOME
    );
    should(entry.path).equal('/api/v1/geoloc');
  });

  it('should strip the source port from the client IP', () => {
    should(accessLogEntry(buildReq(), OUTCOME).ip).equal('37.58.156.218');
  });

  it('should keep the Origin and Referer headers apart', () => {
    const entry = accessLogEntry(
      buildReq({
        headers: {
          origin: 'https://grottocenter.org',
          referer: 'https://grottocenter.org/ui/entrances/1',
        },
      }),
      OUTCOME
    );
    should(entry.origin).equal('https://grottocenter.org');
    should(entry.referer).equal('https://grottocenter.org/ui/entrances/1');
  });

  it('should not report a Referer as the origin', () => {
    const entry = accessLogEntry(
      buildReq({
        headers: { referer: 'https://api.grottocenter.org/api/v1/geoloc?x=1' },
      }),
      OUTCOME
    );
    should(entry.origin).be.null();
    should(entry.referer).equal(
      'https://api.grottocenter.org/api/v1/geoloc?x=1'
    );
  });

  it('should log null for every missing header and IP', () => {
    // A native client sends neither Origin nor Referer; that is not "unknown".
    const entry = accessLogEntry(
      buildReq({ ip: undefined, headers: undefined }),
      OUTCOME
    );
    should(entry).containDeep({
      ip: null,
      userAgent: null,
      origin: null,
      referer: null,
    });
  });

  it('should keep a literal "unknown" Origin distinct from a missing one', () => {
    const entry = accessLogEntry(
      buildReq({ headers: { origin: 'unknown' } }),
      OUTCOME
    );
    should(entry.origin).equal('unknown');
  });

  it('should carry the User-Agent', () => {
    const entry = accessLogEntry(
      buildReq({ headers: { 'user-agent': 'okhttp/4.9.2' } }),
      OUTCOME
    );
    should(entry.userAgent).equal('okhttp/4.9.2');
  });

  it('should mark an anonymous request as such', () => {
    const entry = accessLogEntry(buildReq(), OUTCOME);
    should(entry.authenticated).be.false();
    should(entry.userId).be.null();
  });

  it('should mark an authenticated request with the user id only', () => {
    const entry = accessLogEntry(
      buildReq({
        token: {
          id: 7,
          nickname: 'caver',
          email: 'caver@example.org',
          groups: [{ id: 1, name: 'Administrator' }],
        },
      }),
      OUTCOME
    );
    should(entry.authenticated).be.true();
    should(entry.userId).equal(7);
    should(JSON.stringify(entry)).not.containEql('caver');
    should(JSON.stringify(entry)).not.containEql('Administrator');
  });

  it('should never copy credential-bearing headers', () => {
    const entry = accessLogEntry(
      buildReq({
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret',
          cookie: 'session=abc123',
        },
      }),
      OUTCOME
    );
    const line = JSON.stringify(entry);
    should(line).not.containEql('eyJhbGciOiJIUzI1NiJ9');
    should(line).not.containEql('abc123');
  });

  it('should have a fixed set of fields', () => {
    should(Object.keys(accessLogEntry(buildReq(), OUTCOME))).eql([
      'method',
      'path',
      'status',
      'durationMs',
      'ip',
      'userAgent',
      'origin',
      'referer',
      'authenticated',
      'userId',
    ]);
  });
});
