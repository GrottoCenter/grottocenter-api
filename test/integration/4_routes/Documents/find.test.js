const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document find', () => {
  let userToken;
  let moderatorToken;
  let testDocId;
  let testDocWithModifiedJsonId;
  let testDescId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();

    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    testDocId = doc.id;

    const desc = await TDescription.create({
      author: 1,
      title: 'Original',
      body: 'Original body',
    }).fetch();
    testDescId = desc.id;

    const docWithModifiedJson = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: false,
      descriptions: [desc.id],
      modifiedDocJson: {
        reviewerId: 2,
        documentData: { type: 17 },
        descriptionData: { title: 'Modified', body: 'Modified body' },
      },
    }).fetch();
    testDocWithModifiedJsonId = docWithModifiedJson.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocId });
    await TDocument.destroy({ id: testDocWithModifiedJsonId });
    await TDescription.destroy({ id: testDescId });
  });

  describe('Find', () => {
    it('should return 404 when document does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/999999')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for document ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/0')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for negative document ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/-1')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return a document', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${testDocId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          should(res.body).have.property('type');
          return done();
        });
    });

    it('should return modified document data when requireUpdate is true', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/documents/${testDocWithModifiedJsonId}?requireUpdate=true`
        )
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id');
          return done();
        });
    });

    it('should return modified document with massifs as objects in modifiedDocJson', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Test',
        body: 'Test body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: {
            type: 17,
            massifs: [{ id: 1, name: 'Some massif' }],
          },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      // Inline cleanup: this test creates its own fixture data independent of the shared before/after hooks.
      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${doc.id}?requireUpdate=true`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body).have.property('id');
            should(res.body).have.property('massifs');
            should(res.body.massifs).be.an.Array();
            should(res.body.massifs).not.be.empty();
            should(res.body.massifs).containDeep([{ id: 1 }]);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
        await TDescription.destroy({ id: desc.id });
      }
    });

    it('should return base document when requireUpdate is false', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${testDocId}?requireUpdate=false`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          return done();
        });
    });

    it('should return deleted document with limited info for non-moderator', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isDeleted: true,
      }).fetch();

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${doc.id}`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body).have.property('id', doc.id);
            should(res.body).have.property('isDeleted', true);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
      }
    });

    it('should return full deleted document for moderator', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isDeleted: true,
      }).fetch();

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${doc.id}`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body).have.property('id', doc.id);
            should(res.body).have.property('isDeleted', true);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
      }
    });
  });

  describe('Parent identifier', () => {
    const ISSUE = 17;
    const ARTICLE = 18;
    const created = { documents: [], descriptions: [], files: [] };
    let urlParentId;
    let urlParentFileId;
    let issnParentId;
    let plainParentId;
    let childOfUrlParentId;
    let childOfIssnParentId;
    let childOfPlainParentId;
    let childWithChangedParentId;

    const createDocument = async (data, title) => {
      const doc = await TDocument.create({
        author: 1,
        license: 1,
        isValidated: true,
        ...data,
      }).fetch();
      created.documents.push(doc.id);
      const desc = await TDescription.create({
        author: 1,
        title,
        body: `${title} body`,
        document: doc.id,
      }).fetch();
      created.descriptions.push(desc.id);
      return doc.id;
    };

    const getDocument = async (id, query = '') =>
      (
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${id}${query}`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json')
          .expect(200)
      ).body;

    before(async () => {
      urlParentId = await createDocument(
        {
          type: ISSUE,
          identifier: 'https://example.org/scialet01.pdf',
          identifierType: 'url',
        },
        'Scialet n°1'
      );
      const file = await TFile.create({
        dateInscription: new Date(),
        fileName: 'scialet01.pdf',
        document: urlParentId,
        fileFormat: 1,
        path: `${Date.now()}-scialet01.pdf`,
        isValidated: true,
      }).fetch();
      urlParentFileId = file.id;
      created.files.push(file.id);

      issnParentId = await createDocument(
        { type: ISSUE, identifier: '1234-5678', identifierType: 'issn' },
        'Issn issue'
      );
      plainParentId = await createDocument({ type: ISSUE }, 'Plain issue');

      childOfUrlParentId = await createDocument(
        { type: ARTICLE, parent: urlParentId },
        'Article of the URL issue'
      );
      childOfIssnParentId = await createDocument(
        { type: ARTICLE, parent: issnParentId },
        'Article of the ISSN issue'
      );
      childOfPlainParentId = await createDocument(
        { type: ARTICLE, parent: plainParentId },
        'Article of the plain issue'
      );
      childWithChangedParentId = await createDocument(
        {
          type: ARTICLE,
          parent: plainParentId,
          isValidated: false,
          modifiedDocJson: {
            reviewerId: 2,
            documentData: { type: ARTICLE, parent: urlParentId },
            descriptionData: { title: 'Moved', body: 'Moved body' },
          },
        },
        'Article moving to the URL issue'
      );
    });

    after(async () => {
      await TFile.destroy({ id: created.files });
      await TDescription.destroy({ id: created.descriptions });
      await TDocument.destroy({ id: created.documents });
    });

    it("should expose the parent's URL identifier without inheriting it", async () => {
      const body = await getDocument(childOfUrlParentId);
      should(body.parent).containEql({
        id: urlParentId,
        type: 'Issue',
        title: 'Scialet n°1',
        identifier: 'https://example.org/scialet01.pdf',
        identifierType: 'url',
      });
      should(body).not.have.property('identifier');
      should(body).not.have.property('identifierType');
    });

    it("should keep the parent's description and validated files", async () => {
      const body = await getDocument(childOfUrlParentId);
      should(body.parent.description).equal('Scialet n°1 body');
      should(body.parent.files).have.length(1);
      should(body.parent.files[0]).have.property('id', urlParentFileId);
    });

    it('should preserve a non-URL identifier type', async () => {
      const body = await getDocument(childOfIssnParentId);
      should(body.parent).containEql({
        id: issnParentId,
        identifier: '1234-5678',
        identifierType: 'issn',
      });
    });

    it('should omit both fields for a parent without identifier', async () => {
      const body = await getDocument(childOfPlainParentId);
      should(body.parent).have.property('id', plainParentId);
      should(body.parent).not.have.property('identifier');
      should(body.parent).not.have.property('identifierType');
    });

    it('should still return a document without parent', async () => {
      const body = await getDocument(plainParentId);
      should(body).have.property('id', plainParentId);
      should(body.parent).not.be.ok();
    });

    it('should expose the new parent of a pending update', async () => {
      const current = await getDocument(childWithChangedParentId);
      should(current.parent).have.property('id', plainParentId);

      const pending = await getDocument(
        childWithChangedParentId,
        '?requireUpdate=true'
      );
      should(pending.parent).containEql({
        id: urlParentId,
        title: 'Scialet n°1',
        identifier: 'https://example.org/scialet01.pdf',
        identifierType: 'url',
      });
      should(pending.parent.files).have.length(1);
    });
  });
});
