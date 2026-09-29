const http = require('http');
const express = require('express');
const should = require('should');
const sinon = require('sinon');

const { http: httpConfig } = require('../../../config/http');
const logger = require('../../../api/utils/logger');

// Exercises the two places the real responseTimeLogger writes request input to
// the log on a 5xx: the `Res ::` line, which contains `req.url` verbatim, and the
// "Request data:" block, which contains the parsed body, params and query.
//
// A throwaway Express app is used rather than the lifted Sails server because no
// real endpoint reliably returns 500 with a route parameter, a body and a query
// string all populated at once.
const SECRET = 'Tr0ub4dor-3-correct-horse-battery';

// Kept distinct from SECRET because a secret in a path *segment* is not
// redactable -- nothing marks `/verify/abc123` as sensitive -- so it has to be
// excluded from the "never appears anywhere" assertion to keep that honest.
const PATH_TOKEN = 'path-segment-9f3a2b';

const startServer = () =>
  new Promise((resolve) => {
    const app = express();
    app.use((req, res, next) => {
      req.traceId = 'test-500-trace';
      next();
    });
    app.use(express.json());
    app.use(httpConfig.middleware.responseTimeLogger);
    app.post('/fail/:token', (req, res) => res.status(500).json({}));
    const server = app.listen(0, () => resolve(server));
  });

// Resolves with every line the middleware logged for one failing request.
//
// patchSailsLog() is applied on top of the collectors because it is where the
// redaction lives, and the test environment never calls it (test/bootstrap.test.js
// overrides `bootstrap`). Without it this test would exercise a logging path that
// does not exist in production.
const captureErrorLogs = (port) =>
  new Promise((resolve, reject) => {
    const lines = [];
    const collect =
      () =>
      (...args) =>
        lines.push(args.join(' '));
    // Stubbed first, so patchSailsLog captures the collectors as its originals.
    const info = sinon.stub(sails.log, 'info').callsFake(collect());
    const error = sinon.stub(sails.log, 'error').callsFake(collect());
    logger.patchSailsLog();
    // Restoring the stubs also discards the patch wrapper, which matters because
    // patchSailsLog is not idempotent.
    const restore = () => {
      info.restore();
      error.restore();
    };

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: `/fail/${PATH_TOKEN}?apiKey=${SECRET}&page=2`,
        headers: { 'content-type': 'application/json' },
      },
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
    req.end(JSON.stringify({ email: 'a@example.org', password: SECRET }));
  });

describe('Server error request logging', () => {
  let server;
  let lines;
  let requestData;
  let responseLine;

  before(async () => {
    server = await startServer();
    const { port } = server.address();
    lines = await captureErrorLogs(port);
    // `includes` rather than `startsWith`: the patch prefixes the trace ID.
    requestData = lines.find((line) => line.includes('Request data:'));
    responseLine = lines.find((line) => line.includes('Res ::'));
  });

  after(() => {
    if (server) server.close();
  });

  describe('the "Request data:" block', () => {
    it('should be logged on a 5xx', () => {
      should(requestData).be.a.String();
    });

    it('should redact a credential submitted in the body', () => {
      should(requestData).containEql('"password":"[REDACTED]"');
    });

    it('should redact a credential submitted in the query string', () => {
      should(requestData).containEql('"apiKey":"[REDACTED]"');
    });

    it('should redact a credential submitted as a route parameter', () => {
      // req.params was the one field left unsanitized alongside body and query.
      should(requestData).containEql('"token":"[REDACTED]"');
    });

    it('should keep the non-sensitive request data for triage', () => {
      should(requestData).containEql('"email":"a@example.org"');
      should(requestData).containEql('"page":"2"');
    });
  });

  describe('the "Res ::" line', () => {
    it('should be logged on a 5xx', () => {
      should(responseLine).be.a.String();
    });

    it('should keep the method, path and status for triage', () => {
      should(responseLine).containEql('POST');
      should(responseLine).containEql('/fail/');
      should(responseLine).containEql('500');
    });

    it('should still contain the raw query string keys', () => {
      // Only the values go; losing the keys would make the line useless.
      should(responseLine).containEql('apiKey=');
      should(responseLine).containEql('page=2');
    });
  });

  it('should not leak a body or query credential in any logged line', () => {
    // This is the assertion that matters: `Res ::` logs req.url verbatim, so a
    // query-string credential reaches the log unless scrubbed.
    should(lines.join('\n')).not.containEql(SECRET);
  });
});
