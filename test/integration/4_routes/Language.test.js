const supertest = require('supertest');
const should = require('should');

const LANGUAGE_PROPERTIES = [
  'id',
  'part2b',
  'part2t',
  'part1',
  'scope',
  'type',
  'refName',
  'isPrefered',
];

describe('Language features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/languages/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/languages/fra')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: language } = res;
          should(language).have.properties(LANGUAGE_PROPERTIES);
          should(language.id).not.be.empty();
          should(language.refName).not.be.empty();
          return done();
        });
    });
  });
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/languages')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { languages } = res.body;
          should(languages.length).equal(2);
          for (const language of languages) {
            should(language).have.properties(LANGUAGE_PROPERTIES);
            should(language.id).not.be.undefined();
            should(language.refName).not.be.empty();
          }
          return done();
        });
    });
  });
});
