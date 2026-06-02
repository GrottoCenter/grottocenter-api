const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Document create', () => {
  let userToken;
  const createdDocIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  after(async () => {
    await Promise.all(createdDocIds.map((id) => TDocument.destroy({ id })));
  });

  describe('Create', () => {
    describe('Missing titleAndDescriptionLanguage', () => {
      it('should return code 400 when titleAndDescriptionLanguage is missing', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            description: 'This is a test document.',
            documentMainLanguage: { id: 'fra' },
            documentType: { id: 1 },
            editor: { id: 2 },
            isNewDocument: true,
            title: 'Test Missing Language',
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400);
        should(res.text).match(/titleAndDescriptionLanguage/);
      });
    });

    describe('Backward compatibility with mainLanguage', () => {
      it('should return code 200 when using mainLanguage instead of titleAndDescriptionLanguage', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            description: 'Test backward compat with mainLanguage.',
            documentMainLanguage: { id: 'fra' },
            documentType: { id: 1 },
            editor: { id: 2 },
            isNewDocument: true,
            mainLanguage: 'fra',
            title: 'Test mainLanguage Compat',
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        createdDocIds.push(res.body.document.id);
      });
    });

    describe('Minimal Collection data', () => {
      it('should return code 200', async () => {
        const res = await supertest(sails.hooks.http.app)
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
          .expect(200);
        createdDocIds.push(res.body.document.id);
      });
    });
    describe('With file upload errors', () => {
      it('should return status with file errors when file upload fails', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .field('description', 'Test document with files')
          .field('documentMainLanguage[id]', 'fra')
          .field('documentType[id]', '1')
          .field('editor[id]', '2')
          .field('isNewDocument', 'true')
          .field('title', 'Test with Files')
          .field('titleAndDescriptionLanguage[id]', 'fra')
          .set('Authorization', userToken)
          .set('Accept', 'application/json')
          .expect(200);

        createdDocIds.push(res.body.document.id);
      });
    });

    describe('Complete Collection data', () => {
      it('should return code 200', async () => {
        const res = await supertest(sails.hooks.http.app)
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
            datePublication: '',
            regions: [],
            startPage: null,
            subjects: [{ code: '1.25' }, { code: '4.0' }],
            title: 'Test Collection',
            titleAndDescriptionLanguage: { id: 'fra', refName: 'French' },
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        createdDocIds.push(res.body.document.id);
      });
    });

    describe('Article with issue field', () => {
      it('should return 400 when an Article is created with an issue value', async () => {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            description: 'An article about a cave.',
            title: 'Test Article with Issue',
            type: 'Article',
            issue: '102',
            parent: { id: 1 },
            editor: { id: 2 },
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400);
      });
    });
  });
});
