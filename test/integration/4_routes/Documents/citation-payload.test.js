const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Pins the citation payload on every route that embeds documents through
 * DocumentService.getDocumentsForCitation(): the caver, cave, entrance and
 * massif detail endpoints. A missed populate on any of them would silently
 * degrade the payload back to toSimpleDocument, which the shape assertions in
 * each domain's find.test.js would not catch.
 *
 * The fixture set has no document carrying an editor, a library or the legacy
 * BBS columns, so this suite builds its own document and tears it down after.
 */
describe('Document citation payload on embedded document lists', () => {
  let userToken;

  // Owned by this suite, destroyed in after().
  let editorOrg;
  let libraryOrg;
  let authorOrg;
  let author;
  let parentDoc;
  let citedDoc;
  let cave;
  let entrance;
  let massif;

  const PARENT_TITLE = 'Citation parent collection';
  const CITED_TITLE = 'Citation issue';

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();

    // getMainName / getMainLanguage read the main TName row, so each
    // organization needs one for `name` and `language` to be non-null.
    const createOrg = async (name) => {
      const org = await TGrotto.create({ author: 1 }).fetch();
      await TName.create({
        author: 1,
        name,
        isMain: true,
        language: 'fra',
        grotto: org.id,
      });
      return org;
    };

    [editorOrg, libraryOrg, authorOrg] = await Promise.all([
      createOrg('Citation Editor Org'),
      createOrg('Citation Library Org'),
      createOrg('Citation Author Org'),
    ]);

    author = await TCaver.create({
      nickname: 'citation_author',
      mail: 'citation_author@test.com',
    }).fetch();

    // A document title lives in its descriptions, not on the document row:
    // the parent needs one for the flattened `parent.title` to resolve.
    parentDoc = await TDocument.create({
      author: 1,
      type: 1, // Collection
      license: 1,
      isValidated: true,
    }).fetch();
    await TDescription.create({
      author: 1,
      title: PARENT_TITLE,
      language: 'fra',
      document: parentDoc.id,
    });

    citedDoc = await TDocument.create({
      author: 1,
      type: 17, // Issue — the only type allowed to carry `issue`
      license: 1,
      isValidated: true,
      parent: parentDoc.id,
      editor: editorOrg.id,
      library: libraryOrg.id,
      identifier: '9876-5432',
      identifierType: 'issn',
      issue: 'n°42',
      pages: '10-25',
      datePublication: '2021-07',
      pagesBBSOld: '110-125',
      commentsBBSOld: 'Legacy BBS comment',
      publicationOtherBBSOld: 'Legacy BBS other publication',
      publicationFasciculeBBSOld: 'Legacy BBS fascicule',
    }).fetch();
    await TDescription.create({
      author: 1,
      title: CITED_TITLE,
      language: 'fra',
      document: citedDoc.id,
    });

    await Promise.all([
      JDocumentCaverAuthor.create({ document: citedDoc.id, caver: author.id }),
      JDocumentGrottoAuthor.create({
        document: citedDoc.id,
        grotto: authorOrg.id,
      }),
    ]);

    // Attach the document to one entity of each kind, so every route under
    // test returns it.
    cave = await TCave.create({ author: 1 }).fetch();
    entrance = await TEntrance.create({
      author: 1,
      latitude: 0,
      longitude: 0,
    }).fetch();
    massif = await TMassif.create({ author: 1 }).fetch();

    await Promise.all([
      TDocument.updateOne(citedDoc.id).set({ cave: cave.id }),
      JDocumentEntrance.create({
        document: citedDoc.id,
        entrance: entrance.id,
      }),
      JDocumentMassif.create({ document: citedDoc.id, massif: massif.id }),
    ]);
  });

  after(async () => {
    await Promise.all([
      JDocumentEntrance.destroy({ document: citedDoc.id }),
      JDocumentMassif.destroy({ document: citedDoc.id }),
      JDocumentCaverAuthor.destroy({ document: citedDoc.id }),
      JDocumentGrottoAuthor.destroy({ document: citedDoc.id }),
    ]);
    await TDescription.destroy({ document: [citedDoc.id, parentDoc.id] });
    await TDocument.destroy({ id: citedDoc.id });
    await TDocument.destroy({ id: parentDoc.id });
    await Promise.all([
      TEntrance.destroy({ id: entrance.id }),
      TMassif.destroy({ id: massif.id }),
    ]);
    await TCave.destroy({ id: cave.id });
    await TName.destroy({
      grotto: [editorOrg.id, libraryOrg.id, authorOrg.id],
    });
    await Promise.all([
      TGrotto.destroy({ id: [editorOrg.id, libraryOrg.id, authorOrg.id] }),
      TCaver.destroy({ id: author.id }),
    ]);
  });

  /**
   * Asserts the full citation shape, including the fields that only
   * getDocumentsForCitation() can resolve: organization names (a second query,
   * not an association populate) and the flattened parent title.
   */
  const shouldBeACitationOf = (document) => {
    should(document).have.property('id', citedDoc.id);
    should(document).have.property('title', CITED_TITLE);
    should(document).have.property('type', 'Issue');

    // Resolved through NameService, not through the association.
    should(document.editor).have.property('name', 'Citation Editor Org');
    should(document.library).have.property('name', 'Citation Library Org');
    should(document.authorsOrganization).have.length(1);
    should(document.authorsOrganization[0]).have.property(
      'name',
      'Citation Author Org'
    );

    should(document.authors.map((a) => a.id)).containDeep([author.id]);

    // Flattened to { id, title } rather than nested as a document.
    should(document.parent).have.property('id', parentDoc.id);
    should(document.parent).have.property('title', PARENT_TITLE);
    should(document.parent).not.have.property('type');

    should(document).have.property('identifier', '9876-5432');
    should(document).have.property('identifierType', 'issn');
    should(document).have.property('issue', 'n°42');
    should(document).have.property('pages', '10-25');
    should(document).have.property('datePublication', '2021-07');

    should(document.oldBBS).deepEqual({
      pages: '110-125',
      comments: 'Legacy BBS comment',
      publicationOther: 'Legacy BBS other publication',
      publicationFascicule: 'Legacy BBS fascicule',
    });
  };

  const findCitedDocument = (documents) => {
    should(documents).be.an.Array();
    const document = documents.find((d) => d.id === citedDoc.id);
    should(document).not.be.undefined();
    return document;
  };

  it('should expose the citation fields on GET /caves/:id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`/api/v1/caves/${cave.id}`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    shouldBeACitationOf(findCitedDocument(res.body.documents));
  });

  it('should expose the citation fields on GET /entrances/:id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`/api/v1/entrances/${entrance.id}`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    shouldBeACitationOf(findCitedDocument(res.body.documents));
  });

  it('should expose the citation fields on GET /massifs/:id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`/api/v1/massifs/${massif.id}`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    shouldBeACitationOf(findCitedDocument(res.body.documents));
  });

  it('should expose the citation fields on GET /cavers/:id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`/api/v1/cavers/${author.id}`)
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    shouldBeACitationOf(findCitedDocument(res.body.documents));
  });

  it('should null out the citation fields a document does not carry', async () => {
    const bare = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    await JDocumentMassif.create({ document: bare.id, massif: massif.id });

    try {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/massifs/${massif.id}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const bareBody = res.body.documents.find((d) => d.id === bare.id);
      should(bareBody).not.be.undefined();
      // These are the values the OpenAPI CitationDocument schema declares
      // nullable: the contract must accept them.
      should(bareBody.editor).be.null();
      should(bareBody.library).be.null();
      should(bareBody.parent).be.null();
      should(bareBody.issue).be.null();
      should(bareBody.pages).be.null();
      should(bareBody.datePublication).be.null();
      should(bareBody.authors).have.length(0);
      should(bareBody.authorsOrganization).have.length(0);
      should(bareBody.oldBBS).deepEqual({
        pages: null,
        comments: null,
        publicationOther: null,
        publicationFascicule: null,
      });
    } finally {
      await JDocumentMassif.destroy({ document: bare.id });
      await TDocument.destroy({ id: bare.id });
    }
  });
});
