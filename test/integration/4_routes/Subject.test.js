const supertest = require('supertest');
const should = require('should');

describe('Subject features', () => {
  describe('find()', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/subjects/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/subjects/4.12')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: subject } = res;
          should(subject).have.properties(['code', 'parent', 'subject']);
          should(subject.code).equal('4.12');
          should(subject.subject).equal('AMERICA');
          should(subject.parent.code).equal('4.1');
          should(subject.parent.subject).equal(
            'ARCHAEOLOGY; PREHISTORICAL AND HISTORICAL CULTURES'
          );
          return done();
        });
    });
  });
});
