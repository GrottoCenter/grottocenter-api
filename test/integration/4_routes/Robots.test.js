const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const supertest = require('supertest');
const should = require('should');
const action = require('../../../api/controllers/robots/get');

const ROBOTS_PATH = path.join(__dirname, '../../../assets/robots-api.txt');

describe('API host crawl posture (#1763)', () => {
  afterEach(() => sinon.restore());

  describe('GET /robots.txt', () => {
    it('should return the checked-in file byte for byte, without a token', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/robots.txt')
        .buffer(true)
        .parse((r, cb) => {
          const chunks = [];
          r.on('data', (c) => chunks.push(c));
          r.on('end', () => cb(null, Buffer.concat(chunks)));
        });
      should(res.status).equal(200);
      should(res.headers['content-type']).match(/^text\/plain/);
      should(res.body.equals(fs.readFileSync(ROBOTS_PATH))).be.true();
      should(res.body.toString()).equal('User-agent: *\nDisallow: /\n');
    });
  });

  // The 200 case lives in security-headers.test.js, next to the other headers.
  describe('X-Robots-Tag on custom responses', () => {
    const EXPECTED = 'noindex, nofollow';

    it('should be set on a 404', async () => {
      const res = await supertest(sails.hooks.http.app).get(
        '/api/v1/no-such-route'
      );
      should(res.status).equal(404);
      should(res.headers['x-robots-tag']).equal(EXPECTED);
    });

    it('should be set on a 500', async () => {
      const stub = sinon.stub(TLicense, 'find').rejects(new Error('boom'));
      const res = await supertest(sails.hooks.http.app).get('/api/v1/licenses');
      should(stub.callCount).be.above(0);
      should(res.status).equal(500);
      should(res.headers['x-robots-tag']).equal(EXPECTED);
    });
  });

  // Called directly: neither branch is reachable through supertest.
  describe('error path of the action', () => {
    const fakeRes = (headersSent, error) => ({
      headersSent,
      serverError: sinon.spy(),
      sendFile: (file, opts, cb) => cb(error),
    });

    it('should answer 500 when the file cannot be read', async () => {
      const res = fakeRes(false, new Error('ENOENT'));
      await action({}, res);
      should(res.serverError.calledOnce).be.true();
    });

    it('should not answer again once the headers are sent', async () => {
      const res = fakeRes(true, new Error('ECONNABORTED'));
      await action({}, res);
      should(res.serverError.called).be.false();
    });

    it('should not answer an error when the file was sent', async () => {
      const res = fakeRes(true);
      await action({}, res);
      should(res.serverError.called).be.false();
    });
  });
});
