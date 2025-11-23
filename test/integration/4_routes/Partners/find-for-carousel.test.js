const supertest = require('supertest');
const should = require('should');

describe('Partner find-for-carousel', () => {
  describe('GET /api/v1/partners/findForCarousel', () => {
    it('should return 200 with partners', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/partners/findForCarousel')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('organization');
          should(res.body.organization).be.an.Array();
          return done();
        });
    });

    it('should respect skip parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/partners/findForCarousel?skip=1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should respect limit parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/partners/findForCarousel?limit=5')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
