const http = require('http');
const express = require('express');
const should = require('should');
const sinon = require('sinon');

const { http: httpConfig } = require('../../../config/http');

// Exercises the real responseTimeLogger from config/http.js against a client
// that disconnects mid-flight.
//
// A throwaway Express app is used rather than supertest and the lifted Sails
// server: the abort has to land while the handler is still running, so the
// handler's duration must be controlled. Supertest offers no way to destroy the
// socket at a chosen moment, and racing a real endpoint would be flaky.
const HANDLER_DELAY = 300;
const ABORT_AFTER = 100;

// Wait past the point where the handler would have responded, so a late write
// to the dead socket would have had time to emit a second log line.
const SETTLE = HANDLER_DELAY + 200;

const startServer = () =>
  new Promise((resolve) => {
    const app = express();
    app.use((req, res, next) => {
      req.traceId = 'test-abort-trace';
      next();
    });
    app.use(httpConfig.middleware.responseTimeLogger);
    // Terminal middleware rather than a route, to stay independent of Express
    // path-pattern syntax.
    app.use((req, res) => {
      setTimeout(() => res.json([1, 2, 3]), HANDLER_DELAY);
    });
    const server = app.listen(0, () => resolve(server));
  });

// Resolves once the request has settled, with every 'Res ::' line the
// middleware produced.
const captureResponseLogs = (port, { abort }) =>
  new Promise((resolve) => {
    const lines = [];
    const collect =
      (level) =>
      (...args) => {
        const line = args.join(' ');
        if (line.startsWith('Res ::')) lines.push({ level, line });
      };
    const info = sinon.stub(sails.log, 'info').callsFake(collect('info'));
    const error = sinon.stub(sails.log, 'error').callsFake(collect('error'));

    const req = http.get(`http://127.0.0.1:${port}/slow`, (res) =>
      res.resume()
    );
    // An aborted request makes the client see ECONNRESET; that is the point.
    req.on('error', () => {});
    if (abort) setTimeout(() => req.destroy(), ABORT_AFTER);

    setTimeout(() => {
      info.restore();
      error.restore();
      resolve(lines);
    }, SETTLE);
  });

describe('Client abort logging middleware', () => {
  let server;
  let port;

  before(async () => {
    server = await startServer();
    ({ port } = server.address());
  });

  after(() => {
    if (server) server.close();
  });

  describe('when the client disconnects mid-flight', () => {
    let lines;

    before(async () => {
      lines = await captureResponseLogs(port, { abort: true });
    });

    it('should log the aborted request', () => {
      should(lines).have.length(1);
      should(lines[0].line).startWith('Res :: (client aborted)');
    });

    it('should tag the abort with status 499', () => {
      should(lines[0].line).match(/\b499\b/);
    });

    it('should log the abort at info level, not error', () => {
      // An abort is ordinary client behaviour and must not count against the
      // 5xx error budget.
      should(lines[0].level).equal('info');
    });

    it('should report how long the client waited before giving up', () => {
      should(lines[0].line).match(/\s\d+ms$/);
    });

    it('should not also log a completed response', () => {
      // 'finish' never fires after an abort, so the late discarded write must
      // not produce a second line.
      should(
        lines.filter((l) => l.line.startsWith('Res :: (client aborted)'))
      ).have.length(1);
      should(
        lines.filter((l) => !l.line.startsWith('Res :: (client aborted)'))
      ).have.length(0);
    });
  });

  describe('when the response completes normally', () => {
    let lines;

    before(async () => {
      lines = await captureResponseLogs(port, { abort: false });
    });

    it('should log exactly one response line', () => {
      should(lines).have.length(1);
    });

    it('should not report it as a client abort', () => {
      // 'close' fires on normal completion too, right after 'finish'; the
      // res.writableEnded guard is what separates the two.
      should(lines[0].line).not.match(/client aborted/);
      should(lines[0].line).not.match(/\b499\b/);
      should(lines[0].line).match(/\b200\b/);
    });
  });
});
