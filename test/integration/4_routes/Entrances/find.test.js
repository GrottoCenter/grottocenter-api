const supertest = require('supertest');
const should = require('should');
const ENTRANCE_PROPERTIES = require('./ENTRANCE_PROPERTIES');

describe('Entrance features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrance } = res;
          should(entrance).have.properties(ENTRANCE_PROPERTIES);
          should(entrance.name).equal('The entrance with name 11');
          should(entrance.names).not.be.empty();
          should(entrance.author).not.be.empty();
          should(entrance.comments.length).equal(3);
          should(entrance.descriptions.length).equal(1);
          should(entrance.locations.length).equal(2);
          should(entrance.histories.length).equal(1);
          return done();
        });
    });
  });
});
