const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

/**
 * E2E test verifying that the multer `defParamCharset: 'utf8'` fix
 * correctly preserves non-ASCII filenames through the middleware stack.
 *
 * This test sends an actual multipart HTTP request with a UTF-8 filename
 * through the full Sails middleware pipeline (multer → controller → service → DB),
 * closing the gap identified in code review (review item #4).
 */
describe('Document create — non-ASCII filename encoding (E2E)', () => {
  let userToken;
  const createdDocIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  after(async () => {
    // Clean up created documents (cascades to t_file via FK)
    await Promise.all(createdDocIds.map((id) => TDocument.destroy({ id })));
  });

  it('should preserve a UTF-8 filename through the multipart upload pipeline', async () => {
    const utf8Filename = 'Entrée.pdf';

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/documents')
      .field('description', 'Encoding test document')
      .field('documentMainLanguage[id]', 'fra')
      .field('documentType[id]', '1')
      .field('editor[id]', '2')
      .field('isNewDocument', 'true')
      .field('title', 'Encoding Test')
      .field('titleAndDescriptionLanguage[id]', 'fra')
      .attach('files', Buffer.from('test-content'), utf8Filename)
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(200);

    createdDocIds.push(res.body.document.id);

    // Look up the file record that was created for this document
    const files = await TFile.find({ document: res.body.document.id });
    should(files).have.length(1);

    // The stored filename must match the original UTF-8 name, not mojibake
    should(files[0].fileName).equal(
      utf8Filename,
      `Expected "${utf8Filename}" but got "${files[0].fileName}" — defParamCharset fix may not be working`
    );
  });
});
