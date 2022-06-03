const supertest = require('supertest');
const should = require('should');

const IDENTIFIER_TYPE_PROPERTIES = ['id', 'text', 'regexp'];

describe('IdentifierType features', () => {
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/identifierTypes')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { identifierTypes } = res.body;
          for (const identifierType of identifierTypes) {
            should(identifierType).have.properties(IDENTIFIER_TYPE_PROPERTIES);
            should(identifierType.id).not.be.undefined();
            should(identifierType.text).not.be.empty();
            should(identifierType.regexp).not.be.empty();
          }
          return done();
        });
    });
  });
});
