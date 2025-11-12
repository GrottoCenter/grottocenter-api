const supertest = require('supertest');

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
    }).timeout(10000);

    it('should return RSS feed structure for EN', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/rss/EN')
        .expect(200);

      res.body.should.have.property('title');
      res.body.should.have.property('text');
      res.body.should.have.property('link');
      res.body.should.have.property('day');
      res.body.should.have.property('month');
    }).timeout(10000);
  });
});
