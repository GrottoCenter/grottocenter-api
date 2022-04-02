const supertest = require('supertest');
const should = require('should');

const DOCUMENT_TYPE_PROPERTIES = [
  'id',
  'name',
  'comment',
  'isAvailable',
  'url',
  'parent',
];

describe('DocumentType features', () => {
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/types')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const {
            body: { documentTypes },
          } = res;
          for (const documentType of documentTypes) {
            should(documentType).have.properties(DOCUMENT_TYPE_PROPERTIES);
            should(documentType.id).not.be.undefined();
            should(typeof documentType.isAvailable).equal('boolean');
            should(documentType.name).not.be.empty();
            should(documentType.url).not.be.empty();
          }
          return done();
        });
    });
  });
  describe('find', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/types/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: documentType } = res;
          should(documentType).have.properties(DOCUMENT_TYPE_PROPERTIES);
          should(documentType.id).not.be.undefined();
          should(typeof documentType.isAvailable).equal('boolean');
          should(documentType.name).not.be.empty();
          should(documentType.url).not.be.empty();
          return done();
        });
    });
  });
});
