let supertest = require('supertest');
let should = require('should');
const AuthTokenService = require('../AuthTokenService');

const DOCUMENT_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'authorComment',
  'authorizationDocument',
  'children',
  'dateInscription',
  'datePublication',
  'dateValidation',
  'descriptions',
  'editor',
  'issue',
  'identifier',
  'identifierType',
  'isValidated',
  'library',
  'license',
  'modifiedDocJson',
  'option',
  'pages',
  'type',
  'validationComment',
  'validator',
];

describe('Document features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Count', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.deepEqual({ count: 4 });
          return done();
        });
    });
  });

  describe('Find by caver id', () => {
    // TODO: These tests are waiting for a solution allowing the transaction to be run during test.
    // For more info, see: https://github.com/GrottoCenter/Grottocenter3/pull/629#issuecomment-943298608

    // it('should return a list of user documents', (done) => {
    //   supertest(sails.hooks.http.app)
    //     .get('/api/v1/cavers/1/documents')
    //     .set('Content-type', 'application/json')
    //     .set('Accept', 'application/json')
    //     .expect(200)
    //     .end((err, res) => {
    //       if (err) return done(err);
    //       const { documents } = res.body;
    //       should(documents.length).equals(3);
    //       for (document of documents) {
    //         should(document).have.properties(DOCUMENT_PROPERTIES);
    //       }
    //       return done();
    //     });
    // });
    // it('should return a partial list documents', (done) => {
    //   supertest(sails.hooks.http.app)
    //     .get('/api/v1/cavers/1/documents?limit=2')
    //     .set('Content-type', 'application/json')
    //     .set('Accept', 'application/json')
    //     .expect(206)
    //     .end((err, res) => {
    //       if (err) return done(err);
    //       const { documents } = res.body;
    //       should(documents.length).equals(2);
    //       for (document of documents) {
    //         should(document).have.properties(DOCUMENT_PROPERTIES);
    //       }
    //       return done();
    //     });
    // });
    // it('should return a sorted list of documents', (done) => {
    //   supertest(sails.hooks.http.app)
    //     .get('/api/v1/cavers/1/documents?sortBy=id&orderBy=DESC')
    //     .set('Content-type', 'application/json')
    //     .set('Accept', 'application/json')
    //     .expect(200)
    //     .end((err, res) => {
    //       if (err) return done(err);
    //       const { documents } = res.body;
    //       should(documents.length).equals(3);
    //       const ids = [];
    //       for (document of documents) {
    //         should(document).have.properties(DOCUMENT_PROPERTIES);
    //         ids.push(document.id);
    //         sails.log.info(ids);
    //       }
    //       should(ids[0] > ids[1] && ids[1] < ids[2]).be.true;
    //       return done();
    //     });
    // });
    it('should return an empty list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/3/documents')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { documents } = res.body;
          should(documents.length).equals(0);
          return done();
        });
    });
  });

  // TODO: These tests are waiting for a solution allowing the transaction to be run during test.
  // For more info, see: https://github.com/GrottoCenter/Grottocenter3/pull/629#issuecomment-943298608

  // describe('Create', () => {
  //   describe('Minimal Collection data', () => {
  //     it('should return code 200', (done) => {
  //       supertest(sails.hooks.http.app)
  //         .post('/api/v1/documents')
  //         .send({
  //           description: 'This is a test collection for test purpose.',
  //           documentMainLanguage: { id: 'fra' },
  //           documentType: { id: 1 },
  //           editor: {
  //             id: '9',
  //           },
  //           isNewDocument: true,
  //           title: 'Test Collection',
  //           titleAndDescriptionLanguage: { id: 'fra' },
  //         })
  //         .set('Authorization', userToken)
  //         .set('Content-type', 'application/json')
  //         .set('Accept', 'application/json')
  //         .expect(200, done);
  //     });
  //   });
  //   describe('Complete Collection data', () => {
  //     it('should return code 200', (done) => {
  //       supertest(sails.hooks.http.app)
  //         .post('/api/v1/documents')
  //         .send({
  //           authors: [{ id: 1 }, { id: 2 }],
  //           authorComment: 'I am a simple comment',
  //           description: 'This is a test collection for test purpose.',
  //           documentMainLanguage: { id: 'fra', refName: 'French' },
  //           documentType: { id: 1, name: 'Collection' },
  //           editor: {
  //             id: '9',
  //           },
  //           identifier: 'https://testcol.com',
  //           identifierType: 'url',
  //           isNewDocument: true,
  //           library: null,
  //           massif: null,
  //           partOf: null,
  //           publicationDate: '',
  //           regions: [],
  //           startPage: null,
  //           subjects: [{ code: '1.25' }, { code: '4.0' }],
  //           title: 'Test Collection',
  //           titleAndDescriptionLanguage: { id: 'fra', refName: 'French' },
  //         })
  //         .set('Authorization', userToken)
  //         .set('Content-type', 'application/json')
  //         .set('Accept', 'application/json')
  //         .expect(200, done);
  //     });
  //   });
  // });
});
