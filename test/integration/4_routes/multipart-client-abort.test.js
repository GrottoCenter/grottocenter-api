const http = require('http');
const { EventEmitter } = require('events');
const express = require('express');
const should = require('should');
const sinon = require('sinon');

const { http: httpConfig } = require('../../../config/http');

// #1808: a client that disconnects mid-upload made multer pass 'Request
// aborted' to next(err), which Sails turned into a 500 and an error log.
//
// A throwaway Express app runs the real fileMiddleware: the socket has to be
// destroyed while multer is still reading the body, which supertest cannot do.
const BOUNDARY = 'x';
const PART_HEADER =
  `--${BOUNDARY}\r\n` +
  'Content-Disposition: form-data; name="file"; filename="a.txt"\r\n' +
  'Content-Type: text/plain\r\n\r\n';
const CONTENT = 'hello';
const COMPLETE_BODY = `${PART_HEADER}${CONTENT}\r\n--${BOUNDARY}--\r\n`;

// Leaves time for multer's error path to reach next(), had it been called.
const SETTLE = 300;

const startServer = (outcome) =>
  new Promise((resolve) => {
    const app = express();
    // Emits once the server has started reading the body.
    app.use((req, res, next) => {
      req.once('data', () => outcome.emit('reading'));
      next();
    });
    app.use(httpConfig.middleware.fileMiddleware);
    app.use((req, res) => {
      outcome.emit('handled', req.files);
      res.json({});
    });
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      outcome.emit('failed', err);
      res.status(500).end();
    });
    const server = app.listen(0, () => resolve(server));
  });

const post = (port, contentLength) =>
  http.request({
    port,
    method: 'POST',
    path: '/api/v1/documents',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
      'Content-Length': contentLength,
    },
  });

describe('Multipart upload aborted by the client', () => {
  let server;
  let port;
  let outcome;
  let warn;
  let error;

  before(async () => {
    outcome = new EventEmitter();
    server = await startServer(outcome);
    ({ port } = server.address());
  });

  beforeEach(() => {
    warn = sinon.stub(sails.log, 'warn');
    error = sinon.stub(sails.log, 'error');
  });

  afterEach(() => {
    warn.restore();
    error.restore();
    outcome.removeAllListeners();
  });

  after(() => {
    if (server) server.close();
  });

  it('is dropped without reaching the error handler', async () => {
    const reached = [];
    outcome.on('handled', () => reached.push('handled'));
    outcome.on('failed', (err) => reached.push(`failed: ${err.message}`));

    const req = post(port, 1024 * 1024);
    // The destroyed socket is what the client sees; that is the point.
    req.on('error', () => {});
    outcome.once('reading', () => req.destroy());
    req.write(PART_HEADER);

    await new Promise((resolve) => {
      req.on('close', () => setTimeout(resolve, SETTLE));
    });

    should(reached).be.empty();
    sinon.assert.notCalled(warn);
    sinon.assert.notCalled(error);
  });

  it('still hands a complete upload to the router', async () => {
    const files = new Promise((resolve) => {
      outcome.once('handled', resolve);
    });
    const req = post(port, Buffer.byteLength(COMPLETE_BODY));
    req.on('response', (res) => res.resume());
    req.end(COMPLETE_BODY);

    const { file } = await files;
    should(file).have.length(1);
    should(file[0].buffer.toString()).equal(CONTENT);
  });
});
