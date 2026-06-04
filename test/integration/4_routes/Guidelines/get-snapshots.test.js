const supertest = require('supertest');
const should = require('should');

describe('Guideline get-snapshots', () => {
  describe('get snapshots', () => {
    it('should return 404 when guideline has no snapshots or does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/999999/snapshots')
        .expect(404, done);
    });

    it('should return 200 with snapshots list ordered by date descending', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/1/snapshots')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.guidelines).be.an.Array();
          should(res.body.guidelines.length).be.greaterThan(0);
          should(res.body.guidelines[0].t_id).equal(1);

          const dates = res.body.guidelines.map((s) =>
            new Date(s.id).getTime()
          );
          for (let i = 0; i < dates.length - 1; i += 1) {
            should(dates[i]).be.greaterThanOrEqual(dates[i + 1]);
          }
          return done();
        });
    });
  });
});
