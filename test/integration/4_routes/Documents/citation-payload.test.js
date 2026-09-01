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
  let collectionDoc;
  let parentDoc;
  let citedDoc;
  let cave;
  let entrance;
  let massif;

  const COLLECTION_TITLE = 'Citation periodical collection';
  const ISSUE_TITLE = 'Citation issue';
  const CITED_TITLE = 'Citation article';

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

    // A document title lives in its descriptions, not on the document row, so
    // every level of the chain needs one for its `title` to resolve.
    const createDoc = async (title, attributes) => {
      const doc = await TDocument.create({
        author: 1,
        license: 1,
        isValidated: true,
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

    // The full Article -> Issue -> Collection chain the domain models, which is
    // what an ISO 690 article reference needs: the journal name comes from the
    // Collection, the number and publication date from the Issue.
    collectionDoc = await createDoc(COLLECTION_TITLE, {
      type: 1, // Collection — the journal name in an ISO 690 article reference
    });

    parentDoc = await createDoc(ISSUE_TITLE, {
      type: 17, // Issue — Articles are forbidden from carrying `issue`
      parent: collectionDoc.id,
      issue: 'n°42',
      datePublication: '2021-07',
    });

    citedDoc = await createDoc(CITED_TITLE, {
      type: 18, // Article
      parent: parentDoc.id,
      editor: editorOrg.id,
      library: libraryOrg.id,
      identifier: '9876-5432',
      identifierType: 'issn',
      pages: '10-25',
      datePublication: '2021-07',
      pagesBBSOld: '110-125',
      commentsBBSOld: 'Legacy BBS comment',
      publicationOtherBBSOld: 'Legacy BBS other publication',
      publicationFasciculeBBSOld: 'Legacy BBS fascicule',
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
    await TDescription.destroy({
      document: [citedDoc.id, parentDoc.id, collectionDoc.id],
    });
    // Deleted bottom-up: each level references the one above it.
    await TDocument.destroy({ id: citedDoc.id });
    await TDocument.destroy({ id: parentDoc.id });
    await TDocument.destroy({ id: collectionDoc.id });
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
   * not an association populate) and the whole Article -> Issue -> Collection
   * parent chain.
   */
  const shouldBeACitationOf = (document) => {
    should(document).have.property('id', citedDoc.id);
    should(document).have.property('title', CITED_TITLE);
    should(document).have.property('type', 'Article');

    // Resolved through NameService, not through the association.
    should(document.editor).have.property('name', 'Citation Editor Org');
    should(document.library).have.property('name', 'Citation Library Org');
    should(document.authorsOrganization).have.length(1);
    should(document.authorsOrganization[0]).have.property(
      'name',
      'Citation Author Org'
    );

    should(document.authors.map((a) => a.id)).containDeep([author.id]);

    // The Issue: supplies the number and the publication date of the reference.
    // An Article cannot carry `issue` itself, so without this level the number
    // is unrecoverable.
    should(document.parent).have.property('id', parentDoc.id);
    should(document.parent).have.property('title', ISSUE_TITLE);
    should(document.parent).have.property('type', 'Issue');
    should(document.parent).have.property('issue', 'n°42');
    should(document.parent).have.property('datePublication', '2021-07');

    // The Collection above it: the journal name. Its title must be distinct
    // from the Issue's, which is the whole point of exposing both levels.
    should(document.parent.parent).have.property('id', collectionDoc.id);
    should(document.parent.parent).have.property('title', COLLECTION_TITLE);
    should(document.parent.parent).have.property('type', 'Collection');
    should(document.parent.parent.title).not.equal(document.parent.title);

    // The chain terminates rather than dangling on a raw id.
    should(document.parent.parent.parent).be.null();

    // Kept light: an ancestor is not a full document.
    should(document.parent).not.have.property('files');
    should(document.parent).not.have.property('authors');

    should(document).have.property('identifier', '9876-5432');
    should(document).have.property('identifierType', 'issn');
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
