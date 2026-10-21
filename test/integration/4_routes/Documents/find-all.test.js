const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document find-all', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Find all', () => {
    it('should find all validated documents by default', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
          should([200, 206]).containEql(res.status);
          should(res.body).have.property('documents');
          should(res.body.documents).be.an.Array();
          return done();
        });
    });

    it('should filter by isValidated parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ isValidated: 'false' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
          should([200, 206]).containEql(res.status);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should apply skip parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ skip: 5 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
          should([200, 206]).containEql(res.status);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should apply limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ limit: 10 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.documents.length).be.lessThanOrEqual(10);
          return done();
        });
    });

    it('should cap limit at 100', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ limit: 200 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.documents.length).be.lessThanOrEqual(100);
          return done();
        });
    });

    it('should apply sorting parameters', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ sortBy: 'dateInscription', orderBy: 'DESC' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should filter by document type', async () => {
      const type = await TType.findOne({ name: 'Article' });
      if (!type) return;

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ documentType: 'Article' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json');

      should([200, 206]).containEql(res.status);
      should(res.body).have.property('documents');
    });
  });
});

/**
 * https://github.com/GrottoCenter/grottocenter-api/issues/1914
 * The list loading path populates the organization associations but not their
 * names, which live in TName: the validation queue showed organization icons
 * without names. The fixture set has no document carrying an editor, a library
 * or an organization author, so this suite builds its own and tears it down.
 */
describe('Document lists carry organization names', () => {
  let userToken;

  // Owned by this suite, destroyed in after().
  let editorOrg;
  let libraryOrg;
  let authorOrg;
  let namelessOrg;
  let pendingDoc;
  let validatedDoc;
  let bareDoc;

  const createOrg = async (name, type) => {
    const org = await TGrotto.create({ author: 1, type }).fetch();
    if (name) {
      await TName.create({
        author: 1,
        name,
        isMain: true,
        language: 'fra',
        grotto: org.id,
      });
    }
    return org;
  };

  const createDoc = async (title, attributes) => {
    const doc = await TDocument.create({
      author: 1,
      license: 1,
      type: 18, // Article
      editor: editorOrg.id,
      library: libraryOrg.id,
      ...attributes,
    }).fetch();
    await TDescription.create({
      author: 1,
      title,
      language: 'fra',
      document: doc.id,
    });
    return doc;
  };

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();

    [editorOrg, libraryOrg, authorOrg, namelessOrg] = await Promise.all([
      createOrg('List Editor Org', 'EDITION'),
      createOrg('List Library Org', 'LIBRARY'),
      createOrg('List Author Org', 'RESEARCH'),
      createOrg(null, 'RESEARCH'),
    ]);

    // isValidated=false with no dateValidation: awaiting validation (not refused).
    pendingDoc = await createDoc('List pending document', {
      isValidated: false,
      dateValidation: null,
    });
    validatedDoc = await createDoc('List validated document', {
      isValidated: true,
      dateValidation: '2024-01-01 00:00:00',
    });
    // No editor, no library, no organization author.
    bareDoc = await createDoc('List bare document', {
      isValidated: false,
      dateValidation: null,
      editor: null,
      library: null,
    });

    await Promise.all([
      JDocumentGrottoAuthor.create({
        document: pendingDoc.id,
        grotto: authorOrg.id,
      }),
      JDocumentGrottoAuthor.create({
        document: pendingDoc.id,
        grotto: namelessOrg.id,
      }),
      JDocumentGrottoAuthor.create({
        document: validatedDoc.id,
        grotto: authorOrg.id,
      }),
    ]);
  });

  after(async () => {
    const docIds = [pendingDoc.id, validatedDoc.id, bareDoc.id];
    await JDocumentGrottoAuthor.destroy({ document: docIds });
    await TDescription.destroy({ document: docIds });
    await TDocument.destroy({ id: docIds });
    const orgIds = [editorOrg.id, libraryOrg.id, authorOrg.id, namelessOrg.id];
    await TName.destroy({ grotto: orgIds });
    await TGrotto.destroy({ id: orgIds });
  });

  const list = (url, query = {}) =>
    supertest(sails.hooks.http.app)
      .get(url)
      .query({ limit: 100, ...query })
      .set('Authorization', userToken)
      .set('Accept', 'application/json');

  const findDoc = (res, id) => {
    should([200, 206]).containEql(res.status);
    const document = res.body.documents.find((d) => d.id === id);
    should(document).not.be.undefined();
    return document;
  };

  const shouldCarryOrganizationNames = (document) => {
    should(document.editor).have.property('id', editorOrg.id);
    should(document.editor).have.property('name', 'List Editor Org');
    should(document.editor).have.property('language', 'fra');
    should(document.library).have.property('id', libraryOrg.id);
    should(document.library).have.property('name', 'List Library Org');
    should(document.library).have.property('language', 'fra');
    const authorOrgPayload = document.authorsOrganization.find(
      (o) => o.id === authorOrg.id
    );
    should(authorOrgPayload).have.property('name', 'List Author Org');
    should(authorOrgPayload).have.property('language', 'fra');
  };

  it('should name the organizations of the validation queue', async () => {
    const res = await list('/api/v1/documents', { isValidated: 'false' });
    const document = findDoc(res, pendingDoc.id);
    shouldCarryOrganizationNames(document);
  });

  it('should keep an organization without a main name, unnamed', async () => {
    const res = await list('/api/v1/documents', { isValidated: 'false' });
    const document = findDoc(res, pendingDoc.id);
    should(document.authorsOrganization).have.length(2);
    const nameless = document.authorsOrganization.find(
      (o) => o.id === namelessOrg.id
    );
    should(nameless).have.property('name', null);
    should(nameless).have.property('language', null);
  });

  it('should name the organizations of the validated list', async () => {
    const res = await list('/api/v1/documents');
    const document = findDoc(res, validatedDoc.id);
    shouldCarryOrganizationNames(document);
  });

  it('should name the organizations of the documents of a caver', async () => {
    const res = await list('/api/v1/cavers/1/documents');
    shouldCarryOrganizationNames(findDoc(res, validatedDoc.id));
    shouldCarryOrganizationNames(findDoc(res, pendingDoc.id));
  });

  it('should leave absent relationships null', async () => {
    const res = await list('/api/v1/documents', { isValidated: 'false' });
    const document = findDoc(res, bareDoc.id);
    should(document.editor).be.null();
    should(document.library).be.null();
    should(document.authorsOrganization).be.an.Array().and.have.length(0);
  });
});
