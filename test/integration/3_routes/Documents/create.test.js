let supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Document features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Create', () => {
    describe('Minimal Collection data', () => {
      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            description: 'This is a test collection for test purpose.',
            documentMainLanguage: { id: 'fra' },
            documentType: { id: 1 },
            editor: {
              id: 2,
            },
            isNewDocument: true,
            title: 'Test Collection',
            titleAndDescriptionLanguage: { id: 'fra' },
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
    describe('Complete Collection data', () => {
      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            authors: [{ id: 1 }, { id: 2 }],
            authorComment: 'I am a simple comment',
            description: 'This is a test collection for test purpose.',
            documentMainLanguage: { id: 'fra', refName: 'French' },
            documentType: { id: 1, name: 'Collection' },
            editor: {
              id: 2,
            },
            identifier: 'https://testcol.com',
            identifierType: 'url',
            isNewDocument: true,
            library: null,
            massif: null,
            partOf: null,
            publicationDate: '',
            regions: [],
            startPage: null,
            subjects: [{ code: '1.25' }, { code: '4.0' }],
            title: 'Test Collection',
            titleAndDescriptionLanguage: { id: 'fra', refName: 'French' },
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
  });
});
