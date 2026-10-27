const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

// PDF page offsets (#1936): one signed offset per PDF source, the identifier
// PDF URL of a document and each attached PDF file.
describe('Document PDF page offsets', () => {
  const PDF_URL = 'https://example.org/bulletin.pdf';
  const OTHER_PDF_URL = 'https://example.org/other-bulletin.pdf';
  const PDF_FORMAT_ID = 1;
  const MP4_FORMAT_ID = 6;

  let userToken;
  let moderatorToken;
  const createdDocIds = [];
  const createdFileIds = [];
  const createdDescIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  after(async () => {
    await TFile.destroy({ document: createdDocIds });
    await TFile.destroy({ id: createdFileIds });
    await TDescription.destroy({ document: createdDocIds });
    await TDescription.destroy({ id: createdDescIds });
    await TDocument.update({ id: createdDocIds }).set({ parent: null });
    await TDocument.destroy({ id: createdDocIds });
  });

  const createDocument = async (values = {}) => {
    const desc = await TDescription.create({
      author: 1,
      title: 'PDF offset document',
      body: 'Body',
      language: 'fra',
    }).fetch();
    createdDescIds.push(desc.id);
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
      dateInscription: new Date(),
      descriptions: [desc.id],
      ...values,
    }).fetch();
    createdDocIds.push(doc.id);
    return doc;
  };

  const createFile = async (documentId, values = {}) => {
    const file = await TFile.create({
      dateInscription: new Date(),
      fileName: 'bulletin.pdf',
      document: documentId,
      fileFormat: PDF_FORMAT_ID,
      path: `${Date.now()}-${Math.random()}-bulletin.pdf`,
      isValidated: true,
      ...values,
    }).fetch();
    createdFileIds.push(file.id);
    return file;
  };

  const postDocument = () =>
    supertest(sails.hooks.http.app)
      .post('/api/v1/documents')
      .field('title', 'PDF offset document')
      .field('description', 'Body')
      .field('titleAndDescriptionLanguage[id]', 'fra')
      .set('Authorization', userToken)
      .set('Accept', 'application/json');

  const putDocument = (id, token = userToken) =>
    supertest(sails.hooks.http.app)
      .put(`/api/v1/documents/${id}`)
      .field('title', 'PDF offset document')
      .field('description', 'Body')
      .field('titleAndDescriptionLanguage[id]', 'fra')
      .set('Authorization', token)
      .set('Accept', 'application/json');

  const getDocument = (id, query = '') =>
    supertest(sails.hooks.http.app)
      .get(`/api/v1/documents/${id}${query}`)
      .set('Authorization', moderatorToken)
      .set('Accept', 'application/json')
      .expect(200);

  const moderate = (id, isValidated) =>
    supertest(sails.hooks.http.app)
      .put('/api/v1/documents/validate')
      .send({
        documents: [
          {
            id,
            isValidated: String(isValidated),
            validationComment: isValidated ? undefined : 'Refused',
          },
        ],
      })
      .set('Authorization', moderatorToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

  const trackCreated = (res) => {
    if (res.body?.document?.id) createdDocIds.push(res.body.document.id);
    return res;
  };

  describe('Identifier PDF URL offset', () => {
    it('should create a document with a zero offset', async () => {
      const res = trackCreated(
        await postDocument()
          .field('identifier', PDF_URL)
          .field('identifierType[id]', 'url')
          .field('identifierPdfPageOffset', '0')
          .expect(200)
      );
      should(res.body.document.identifierPdfPageOffset).equal(0);
      const stored = await TDocument.findOne(res.body.document.id);
      should(stored.identifierPdfPageOffset).equal(0);
    });

    it('should create a document with a negative offset sent as JSON', async () => {
      const res = trackCreated(
        await supertest(sails.hooks.http.app)
          .post('/api/v1/documents')
          .send({
            title: 'PDF offset document',
            description: 'Body',
            titleAndDescriptionLanguage: { id: 'fra' },
            identifier: PDF_URL,
            identifierType: { id: 'url' },
            identifierPdfPageOffset: -126,
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .expect(200)
      );
      should(res.body.document.identifierPdfPageOffset).equal(-126);
    });

    it('should default to null when the offset is omitted on creation', async () => {
      const res = trackCreated(
        await postDocument()
          .field('identifier', PDF_URL)
          .field('identifierType[id]', 'url')
          .expect(200)
      );
      should(res.body.document.identifierPdfPageOffset).be.null();
    });

    [
      ['a fractional value', '1.5'],
      ['a malformed value', 'abc'],
      ['an out-of-range value', '2147483648'],
      ['an out-of-range negative value', '-2147483648'],
    ].forEach(([label, value]) => {
      it(`should reject ${label}`, async () => {
        const before = await TDocument.count();
        const res = await postDocument()
          .field('identifier', PDF_URL)
          .field('identifierType[id]', 'url')
          .field('identifierPdfPageOffset', value)
          .expect(400);
        trackCreated(res);
        should(await TDocument.count()).equal(before);
      });
    });

    it('should reject an offset on an identifier that is not a PDF URL', async () => {
      trackCreated(
        await postDocument()
          .field('identifier', 'https://example.org/bulletin.html')
          .field('identifierType[id]', 'url')
          .field('identifierPdfPageOffset', '1')
          .expect(400)
      );
    });

    it('should reject an offset on an identifier that is not a URL', async () => {
      trackCreated(
        await postDocument()
          .field('identifier', '10.1234/bulletin.pdf')
          .field('identifierType[id]', 'doi')
          .field('identifierPdfPageOffset', '1')
          .expect(400)
      );
    });

    it('should keep the stored offset when an update omits it', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifier', PDF_URL)
        .field('identifierType[id]', 'url')
        .expect(200);

      const { modifiedDocJson } = await TDocument.findOne(doc.id);
      should(modifiedDocJson.documentData).not.have.property(
        'identifierPdfPageOffset'
      );
      const preview = await getDocument(doc.id, '?requireUpdate=true');
      should(preview.body.identifierPdfPageOffset).equal(5);

      await moderate(doc.id, true);
      should((await TDocument.findOne(doc.id)).identifierPdfPageOffset).equal(
        5
      );
    });

    it('should clear the offset on an explicit empty value', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifierPdfPageOffset', '')
        .expect(200);

      const preview = await getDocument(doc.id, '?requireUpdate=true');
      should(preview.body.identifierPdfPageOffset).be.null();
      const details = await getDocument(doc.id);
      should(details.body.identifierPdfPageOffset).equal(5);

      await moderate(doc.id, true);
      should(
        (await TDocument.findOne(doc.id)).identifierPdfPageOffset
      ).be.null();
    });

    it('should update the offset to zero through moderation', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifierPdfPageOffset', '0')
        .expect(200);
      await moderate(doc.id, true);

      const details = await getDocument(doc.id);
      should(details.body.identifierPdfPageOffset).equal(0);
    });

    it('should keep the stored offset when the modification is refused', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifierPdfPageOffset', '')
        .expect(200);
      await moderate(doc.id, false);

      const stored = await TDocument.findOne(doc.id);
      should(stored.identifierPdfPageOffset).equal(5);
      should(stored.modifiedDocJson).be.null();
    });

    it('should clear the offset when the identifier changes', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifier', OTHER_PDF_URL)
        .field('identifierType[id]', 'url')
        .expect(200);

      const { modifiedDocJson } = await TDocument.findOne(doc.id);
      should(modifiedDocJson.documentData.identifierPdfPageOffset).be.null();
    });

    it('should clear the offset when the identifier type changes', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifier', PDF_URL)
        .field('identifierType[id]', 'doi')
        .expect(200);

      const { modifiedDocJson } = await TDocument.findOne(doc.id);
      should(modifiedDocJson.documentData.identifierPdfPageOffset).be.null();
    });

    it('should keep a replacement offset sent with a new identifier', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 5,
      });
      await putDocument(doc.id)
        .field('identifier', OTHER_PDF_URL)
        .field('identifierType[id]', 'url')
        .field('identifierPdfPageOffset', '-3')
        .expect(200);

      const { modifiedDocJson } = await TDocument.findOne(doc.id);
      should(modifiedDocJson.documentData.identifierPdfPageOffset).equal(-3);
    });

    it('should record the previous offset in the document history', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 7,
      });
      const customSQL = require('../../../customSQL'); // eslint-disable-line global-require
      await sails.sendNativeQuery(customSQL.ATTACH_DOCUMENT_HISTO_TRIGGER);
      try {
        await TDocument.updateOne(doc.id).set({ identifierPdfPageOffset: 0 });
      } finally {
        await sails.sendNativeQuery(customSQL.DETACH_DOCUMENT_HISTO_TRIGGER);
      }
      const history = await HDocument.find({ t_id: doc.id });
      should(history.map((h) => h.identifierPdfPageOffset)).deepEqual([7]);
      await HDocument.destroy({ t_id: doc.id });
    });
  });

  describe('Identifier offset in the JSON update flow', () => {
    const putNewEntities = (id, document) =>
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${id}/new-entities`)
        .send({ document })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

    it('should set and preserve a zero offset', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
      });
      await putNewEntities(doc.id, { identifierPdfPageOffset: 0 }).expect(200);
      should((await TDocument.findOne(doc.id)).identifierPdfPageOffset).equal(
        0
      );

      await putNewEntities(doc.id, { pages: '29-35' }).expect(200);
      should((await TDocument.findOne(doc.id)).identifierPdfPageOffset).equal(
        0
      );
    });

    it('should clear the offset with null', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 4,
      });
      await putNewEntities(doc.id, { identifierPdfPageOffset: null }).expect(
        200
      );
      should(
        (await TDocument.findOne(doc.id)).identifierPdfPageOffset
      ).be.null();
    });

    it('should clear the offset when the identifier changes', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 4,
      });
      await putNewEntities(doc.id, { identifier: OTHER_PDF_URL }).expect(200);
      should(
        (await TDocument.findOne(doc.id)).identifierPdfPageOffset
      ).be.null();
    });

    it('should reject a fractional offset', async () => {
      const doc = await createDocument({
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 4,
      });
      await putNewEntities(doc.id, { identifierPdfPageOffset: 1.5 }).expect(
        400
      );
      should((await TDocument.findOne(doc.id)).identifierPdfPageOffset).equal(
        4
      );
    });

    it('should reject an offset on a document without a PDF URL', async () => {
      const doc = await createDocument();
      await putNewEntities(doc.id, { identifierPdfPageOffset: 1 }).expect(400);
    });
  });

  describe('Uploaded files', () => {
    let FileService;
    let createStub;

    before(() => {
      // eslint-disable-next-line global-require
      FileService = require('../../../../api/services/FileService');
    });

    afterEach(() => {
      if (createStub) createStub.restore();
      createStub = undefined;
    });

    // Delays each upload so that they complete in reverse order.
    const stubReverseCompletion = (fileCount) => {
      const original = FileService.document.create;
      let call = 0;
      createStub = sinon
        .stub(FileService.document, 'create')
        .callsFake(async (...args) => {
          const delay = (fileCount - call) * 30;
          call += 1;
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
          return original.apply(FileService.document, args);
        });
    };

    it('should associate each offset with its file on creation, whatever the completion order', async () => {
      stubReverseCompletion(3);
      const res = trackCreated(
        await postDocument()
          .attach('files', Buffer.from('%PDF-1'), 'first.pdf')
          .attach('files', Buffer.from('%PDF-2'), 'second.pdf')
          .attach('files', Buffer.from('%PDF-3'), 'third.pdf')
          .field('newFilesMetadata[0][pdfPageOffset]', '0')
          .field('newFilesMetadata[2][pdfPageOffset]', '-126')
          .expect(200)
      );
      should(createStub.callCount).equal(3);

      const files = await TFile.find({ document: res.body.document.id });
      const offsetsByName = Object.fromEntries(
        files.map((f) => [f.fileName, f.pdfPageOffset])
      );
      should(offsetsByName).deepEqual({
        'first.pdf': 0,
        'second.pdf': null,
        'third.pdf': -126,
      });
      const returned = Object.fromEntries(
        res.body.document.files.map((f) => [f.fileName, f.pdfPageOffset])
      );
      should(returned).deepEqual(offsetsByName);
    });

    it('should reject metadata without a matching upload before creating anything', async () => {
      const before = await TDocument.count();
      trackCreated(
        await postDocument()
          .attach('files', Buffer.from('%PDF-1'), 'first.pdf')
          .field('newFilesMetadata[1][pdfPageOffset]', '1')
          .expect(400)
      );
      should(await TDocument.count()).equal(before);
    });

    it('should reject an offset on an uploaded file that is not a PDF', async () => {
      const doc = await createDocument();
      await putDocument(doc.id)
        .attach('files', Buffer.from('not a pdf'), 'video.mp4')
        .field('newFilesMetadata[0][pdfPageOffset]', '1')
        .expect(400);
      should(await TFile.count({ document: doc.id })).equal(0);
    });

    it('should store new file offsets on update, counting only the uploads', async () => {
      const doc = await createDocument();
      await createFile(doc.id, { pdfPageOffset: 9 });
      stubReverseCompletion(2);
      await putDocument(doc.id)
        .attach('files', Buffer.from('%PDF-1'), 'new-a.pdf')
        .attach('files', Buffer.from('%PDF-2'), 'new-b.pdf')
        .field('newFilesMetadata[1][pdfPageOffset]', '3')
        .expect(200);

      const newFiles = await TFile.find({
        document: doc.id,
        isValidated: false,
      });
      should(
        Object.fromEntries(newFiles.map((f) => [f.fileName, f.pdfPageOffset]))
      ).deepEqual({ 'new-a.pdf': null, 'new-b.pdf': 3 });

      const preview = await getDocument(doc.id, '?requireUpdate=true');
      should(
        Object.fromEntries(
          preview.body.newFiles.map((f) => [f.fileName, f.pdfPageOffset])
        )
      ).deepEqual({ 'new-a.pdf': null, 'new-b.pdf': 3 });

      await moderate(doc.id, true);
      const details = await getDocument(doc.id);
      should(
        Object.fromEntries(
          details.body.files.map((f) => [f.fileName, f.pdfPageOffset])
        )
      ).deepEqual({ 'bulletin.pdf': 9, 'new-a.pdf': null, 'new-b.pdf': 3 });
    });
  });

  describe('Existing files', () => {
    it('should update an existing file offset to zero without an upload', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id, { pdfPageOffset: 9 });
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][fileName]', 'bulletin.pdf')
        .field('modifiedFiles[0][pdfPageOffset]', '0')
        .expect(200);

      should((await TFile.findOne(file.id)).pdfPageOffset).equal(9);
      const preview = await getDocument(doc.id, '?requireUpdate=true');
      should(preview.body.modifiedFiles).have.length(1);
      should(preview.body.modifiedFiles[0]).containEql({
        id: file.id,
        fileName: 'bulletin.pdf',
        pdfPageOffset: 0,
      });

      await moderate(doc.id, true);
      const stored = await TFile.findOne(file.id);
      should(stored.pdfPageOffset).equal(0);
      should(stored.fileName).equal('bulletin.pdf');
    });

    it('should clear an existing file offset and keep its name when omitted', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id, { pdfPageOffset: 9 });
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][pdfPageOffset]', '')
        .expect(200);

      const preview = await getDocument(doc.id, '?requireUpdate=true');
      should(preview.body.modifiedFiles[0]).containEql({
        fileName: 'bulletin.pdf',
        pdfPageOffset: null,
      });

      await moderate(doc.id, true);
      const stored = await TFile.findOne(file.id);
      should(stored.pdfPageOffset).be.null();
      should(stored.fileName).equal('bulletin.pdf');
    });

    it('should keep an existing file offset when only the name changes', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id, { pdfPageOffset: 9 });
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][fileName]', 'renamed.pdf')
        .expect(200);
      await moderate(doc.id, true);

      const stored = await TFile.findOne(file.id);
      should(stored.pdfPageOffset).equal(9);
      should(stored.fileName).equal('renamed.pdf');
    });

    it('should keep an existing file offset when the modification is refused', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id, { pdfPageOffset: 9 });
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][pdfPageOffset]', '1')
        .expect(200);
      await moderate(doc.id, false);

      should((await TFile.findOne(file.id)).pdfPageOffset).equal(9);
    });

    it('should reject a change to a file of another document', async () => {
      const doc = await createDocument();
      const otherDoc = await createDocument();
      const file = await createFile(otherDoc.id);
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][pdfPageOffset]', '1')
        .expect(400);
      should((await TDocument.findOne(doc.id)).modifiedDocJson).be.null();
    });

    it('should reject an offset on an existing file that is not a PDF', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id, {
        fileName: 'video.mp4',
        fileFormat: MP4_FORMAT_ID,
      });
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][pdfPageOffset]', '1')
        .expect(400);
    });

    it('should reject an out-of-range existing file offset', async () => {
      const doc = await createDocument();
      const file = await createFile(doc.id);
      await putDocument(doc.id)
        .field('modifiedFiles[0][id]', String(file.id))
        .field('modifiedFiles[0][pdfPageOffset]', '99999999999')
        .expect(400);
    });
  });

  describe('Parent document offsets', () => {
    it('should expose the parent identifier and file offsets in article details', async () => {
      const parent = await createDocument({
        type: 17, // Issue
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 1,
      });
      const parentFile = await createFile(parent.id, { pdfPageOffset: 2 });
      const article = await createDocument({
        type: 18, // Article
        parent: parent.id,
        pages: '29-35',
      });

      const res = await getDocument(article.id);
      should(res.body.pages).equal('29-35');
      should(res.body.identifierPdfPageOffset).be.null();
      should(res.body.parent).containEql({
        id: parent.id,
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 1,
      });
      should(res.body.parent.files).have.length(1);
      should(res.body.parent.files[0]).containEql({
        id: parentFile.id,
        pdfPageOffset: 2,
      });
    });

    it('should expose the parent offsets in a pending preview', async () => {
      const parent = await createDocument({
        type: 17, // Issue
        identifier: PDF_URL,
        identifierType: 'url',
        identifierPdfPageOffset: 0,
      });
      await createFile(parent.id, { pdfPageOffset: -2 });
      const article = await createDocument({
        type: 18, // Article
        pages: '29-35',
        isValidated: false,
        modifiedDocJson: {
          reviewerId: 1,
          documentData: { type: 18, parent: parent.id, pages: '29-35' },
          descriptionData: { title: 'Article', body: 'Body' },
        },
      });

      const res = await getDocument(article.id, '?requireUpdate=true');
      should(res.body.pages).equal('29-35');
      should(res.body.parent.identifierPdfPageOffset).equal(0);
      should(res.body.parent.files[0].pdfPageOffset).equal(-2);
    });
  });
});
