const supertest = require('supertest');
const should = require('should');

const FILE_FORMAT_PROPERTIES = [
  'id',
  'extension',
  'comment',
  'mimeType',
  'softwares',
];

describe('FileFormat features', () => {
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/file-formats')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: fileFormats } = res;
          for (const fileFormat of fileFormats) {
            should(fileFormat).have.properties(FILE_FORMAT_PROPERTIES);
            should(fileFormat.id).not.be.undefined();
            should(fileFormat.extension).not.be.empty();
            should(fileFormat.mimeType).not.be.empty();
          }
          return done();
        });
    });
  });
});
