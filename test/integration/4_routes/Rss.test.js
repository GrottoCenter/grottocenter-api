const supertest = require('supertest');
const sinon = require('sinon');
const Parser = require('rss-parser');

describe('RSS endpoints', () => {
  describe('GET /api/v1/rss/:language', () => {
    it('should return RSS feed structure for FR', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/rss/FR')
        .expect(200);

      res.body.should.have.property('title');
      res.body.should.have.property('text');
      res.body.should.have.property('link');
      res.body.should.have.property('day');
      res.body.should.have.property('month');
    }).timeout(15000);

    it('should return RSS feed structure for EN', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/rss/EN')
        .expect(200);

      res.body.should.have.property('title');
      res.body.should.have.property('text');
      res.body.should.have.property('link');
      res.body.should.have.property('day');
      res.body.should.have.property('month');
    }).timeout(15000);

    it('should return 502 when upstream feed times out', async () => {
      const stub = sinon
        .stub(Parser.prototype, 'parseURL')
        .rejects(new Error('Request timed out after 10000ms'));

      try {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/rss/FR')
          .expect(502);

        res.body.should.have.property('message');
        res.body.message.should.match(/unavailable/);
      } finally {
        stub.restore();
      }
    });

    it('should return 502 when upstream feed connection is refused', async () => {
      const err = new Error('connect ECONNREFUSED');
      err.code = 'ECONNREFUSED';
      const stub = sinon.stub(Parser.prototype, 'parseURL').rejects(err);

      try {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/rss/EN')
          .expect(502);

        res.body.should.have.property('message');
        res.body.message.should.match(/unavailable/);
      } finally {
        stub.restore();
      }
    });

    it('should return 502 when upstream feed DNS resolution fails', async () => {
      const err = new Error('getaddrinfo ENOTFOUND blog-fr.grottocenter.org');
      err.code = 'ENOTFOUND';
      const stub = sinon.stub(Parser.prototype, 'parseURL').rejects(err);

      try {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/rss/FR')
          .expect(502);

        res.body.should.have.property('message');
        res.body.message.should.match(/unavailable/);
      } finally {
        stub.restore();
      }
    });

    it('should return 500 for unexpected errors', async () => {
      const stub = sinon
        .stub(Parser.prototype, 'parseURL')
        .rejects(new Error('Unexpected XML parsing failure'));

      try {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/rss/FR')
          .expect(500);

        res.body.should.have.property('message');
        res.body.message.should.equal('An internal server error occurred.');
      } finally {
        stub.restore();
      }
    });
  });
});
