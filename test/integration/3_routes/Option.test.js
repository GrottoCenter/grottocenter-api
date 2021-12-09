let supertest = require('supertest');
let should = require('should');

const OPTION_PROPERTIES = ['id', 'name'];

describe('Option features', () => {
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/options')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: options } = res;
          for (const option of options) {
            should(option).have.properties(OPTION_PROPERTIES);
            should(option.id).not.be.undefined();
            should(option.name).not.be.empty();
          }
          return done();
        });
    });
  });
});
