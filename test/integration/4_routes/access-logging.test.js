const http = require('http');
const express = require('express');
const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const { http: httpConfig } = require('../../../config/http');
const logger = require('../../../api/utils/logger');
const { tokenSalt } = require('../../../api/services/TokenService');
const { scrubString } = require('../../../api/utils/redactLogArgs');

// Exercises the `Access ::` line the real responseTimeLogger writes once per
// request (#1788), through the same patchSailsLog() redaction it goes through
// in production.
//
// A throwaway Express app is used, as in server-error-request-logging.test.js,
// so the request headers and `req.token` can be set exactly.
const SECRET = 'Tr0ub4dor-3-correct-horse-battery';
const MARKER = 'Access :: ';

const startServer = () =>
  new Promise((resolve) => {
    const app = express();
    app.use((req, res, next) => {
      req.traceId = 'test-access-trace';
      // Stands in for parseAuthToken, which runs before the loggers.
      if (req.headers['x-test-user']) {
        req.token = {
          id: Number(req.headers['x-test-user']),
          nickname: 'caver',
          groups: [{ id: 1, name: 'Administrator' }],
        };
      }
      next();
    });
    app.use(httpConfig.middleware.responseTimeLogger);
    app.use(httpConfig.middleware.requestLogger);
    app.get('/ok', (req, res) => res.json({}));
    app.use((req, res) => res.status(404).json({}));
    const server = app.listen(0, () => resolve(server));
  });

// The configured middleware order, up to requestLogger: everything in it that
// can answer before the router does, in production order.
const startConfiguredServer = () =>
  new Promise((resolve) => {
    const app = express();
    const { order } = httpConfig.middleware;
    order
      .slice(0, order.indexOf('requestLogger') + 1)
      .forEach((name) => app.use(httpConfig.middleware[name]));
    app.use((req, res) => res.status(404).json({}));
    const server = app.listen(0, () => resolve(server));
  });

// Resolves with every line logged for one request.
const captureLogs = (port, { path, method = 'GET', headers = {} }) =>
  new Promise((resolve, reject) => {
    const lines = [];
    const collect =
      () =>
      (...args) =>
        lines.push(args.join(' '));
    // Stubbed first, so patchSailsLog captures the collectors as its originals.
    const info = sinon.stub(sails.log, 'info').callsFake(collect());
    const error = sinon.stub(sails.log, 'error').callsFake(collect());
    const warn = sinon.stub(sails.log, 'warn').callsFake(collect());
    logger.patchSailsLog();
    const restore = () => {
      info.restore();
      error.restore();
      warn.restore();
    };

    const req = http.request(
      { host: '127.0.0.1', port, method, path, headers },
      (res) => {
        res.resume();
        // The server-side 'finish' handler runs independently of the client
        // seeing the end of the response, so settle before reading the lines.
        res.on('end', () =>
          setTimeout(() => {
            restore();
            resolve(lines);
          }, 100)
        );
      }
    );
    req.on('error', (err) => {
      restore();
      reject(err);
    });
    req.end();
  });

const accessLines = (lines) => lines.filter((line) => line.includes(MARKER));

// `includes` rather than `startsWith`: the patch prefixes the trace ID.
const parseAccess = (line) =>
  JSON.parse(line.slice(line.indexOf(MARKER) + MARKER.length));

describe('Access logging', () => {
  let server;
  let port;

  before(async () => {
    server = await startServer();
    ({ port } = server.address());
  });

  after(() => {
    if (server) server.close();
  });

  describe('a native client with no Origin, Referer or token', () => {
    let lines;
    let entry;

    before(async () => {
      lines = await captureLogs(port, {
        path: '/ok?lang=fr',
        headers: { 'user-agent': 'okhttp/4.9.2' },
      });
      [entry] = accessLines(lines).map(parseAccess);
    });

    it('should write exactly one access line', () => {
      should(accessLines(lines)).have.length(1);
    });

    it('should prefix the line with the trace ID', () => {
      should(accessLines(lines)[0]).startWith('[test-access-trace] Access :: ');
    });

    it('should carry the request and its outcome on the same line', () => {
      should(entry).containDeep({
        method: 'GET',
        path: '/ok',
        status: 200,
        userAgent: 'okhttp/4.9.2',
      });
      should(entry.durationMs).be.a.Number();
      should(entry.ip).be.a.String();
    });

    it('should log null, not "unknown", for the missing headers', () => {
      should(entry.origin).be.null();
      should(entry.referer).be.null();
    });

    it('should mark the request as anonymous', () => {
      should(entry.authenticated).be.false();
      should(entry.userId).be.null();
    });

    it('should keep the legacy lines for the transition', () => {
      should(lines.some((line) => line.includes('Req ::'))).be.true();
      should(lines.some((line) => line.includes('Client data:'))).be.true();
    });
  });

  describe('a browser request from an authenticated user', () => {
    let lines;
    let entry;

    before(async () => {
      lines = await captureLogs(port, {
        path: '/missing',
        headers: {
          origin: 'https://grottocenter.org',
          referer: `https://grottocenter.org/ui/search?token=${SECRET}`,
          authorization: `Bearer ${SECRET}`,
          cookie: `session=${SECRET}`,
          'x-test-user': '7',
        },
      });
      [entry] = accessLines(lines).map(parseAccess);
    });

    it('should report the real status', () => {
      should(entry.status).equal(404);
    });

    it('should keep the Origin and Referer apart', () => {
      should(entry.origin).equal('https://grottocenter.org');
      should(entry.referer).startWith('https://grottocenter.org/ui/search?');
    });

    it('should log the user id and nothing else from the token', () => {
      should(entry.authenticated).be.true();
      should(entry.userId).equal(7);
      should(accessLines(lines)[0]).not.containEql('caver');
      should(accessLines(lines)[0]).not.containEql('Administrator');
    });

    it('should not leak a credential from the headers or the Referer', () => {
      should(accessLines(lines)[0]).not.containEql(SECRET);
    });
  });

  describe('quotes in client-controlled header and query values', () => {
    let line;

    before(async () => {
      const lines = await captureLogs(port, {
        path: `/ok?token=${SECRET}"x&q='a'`,
        headers: {
          referer: `https://example.org/?token=${SECRET}"def&lang='fr'`,
          'user-agent': 'Mozilla "quoted" password=\'x\' a:b',
          origin: 'https://example.org',
        },
      });
      // The production formatter (config/log.js) scrubs the line once more.
      line = scrubString(accessLines(lines)[0]);
    });

    it('should still emit a line that parses as JSON', () => {
      should(() => parseAccess(line)).not.throw();
    });

    it('should keep every field, redacting only the credentials', () => {
      const entry = parseAccess(line);
      should(entry).containDeep({
        path: '/ok',
        origin: 'https://example.org',
        referer: `https://example.org/?token=[REDACTED]"def&lang='fr'`,
        userAgent: `Mozilla "quoted" password='[REDACTED]' a:b`,
        status: 200,
      });
      should(line).not.containEql(SECRET);
    });
  });

  // Middleware that answers on its own never calls next(); the access line
  // must still be written for it.
  describe('responses sent before the router, in the configured order', () => {
    let configured;
    let configuredPort;

    before(async () => {
      configured = await startConfiguredServer();
      ({ port: configuredPort } = configured.address());
    });

    after(() => {
      if (configured) configured.close();
    });

    it('should log a CORS preflight answered by corsHeaders', async () => {
      const lines = await captureLogs(configuredPort, {
        path: '/api/v1/caves',
        method: 'OPTIONS',
      });
      should(accessLines(lines).map(parseAccess)).containDeep([
        { method: 'OPTIONS', path: '/api/v1/caves', status: 200 },
      ]);
      should(accessLines(lines)).have.length(1);
    });

    it('should log a token rejected by parseAuthToken', async () => {
      // Valid signature, but no `iat`: parseAuthToken answers 401 itself.
      const token = jwt.sign({ id: 7, sub: 'Authentication' }, tokenSalt, {
        noTimestamp: true,
      });
      const lines = await captureLogs(configuredPort, {
        path: '/api/v1/caves',
        headers: { authorization: `Bearer ${token}` },
      });
      should(accessLines(lines)).have.length(1);
      should(parseAccess(accessLines(lines)[0])).containDeep({
        status: 401,
        authenticated: false,
        userId: null,
      });
    });

    it('should log a request refused by a rate limiter', async () => {
      // The limiters skip test and development; an anonymous caller gets one
      // DELETE per hour in production.
      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const send = () =>
          captureLogs(configuredPort, {
            path: '/api/v1/caves/1',
            method: 'DELETE',
          });
        await send();
        const lines = await send();
        should(accessLines(lines)).have.length(1);
        should(parseAccess(accessLines(lines)[0])).containDeep({
          method: 'DELETE',
          status: 429,
        });
      } finally {
        process.env.NODE_ENV = nodeEnv;
      }
    });
  });
});
