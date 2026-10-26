const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const PDF_FORMAT = 1;
const TXT_FORMAT = 51;
// t_file 4 belongs to document 2 in the fixtures.
const FOREIGN_FILE_ID = 4;

// A multipart create request carrying the fields the web client sends.
const createRequest = (token, title) =>
  supertest(sails.hooks.http.app)
    .post('/api/v1/documents')
    .field('description', 'PDF page offset test document')
    .field('documentMainLanguage[id]', 'fra')
    .field('editor[id]', '2')
    .field('isNewDocument', 'true')
    .field('title', title)
    .field('titleAndDescriptionLanguage[id]', 'fra')
    .set('Authorization', token)
    .set('Accept', 'application/json');

const updateRequest = (token, documentId) =>
  supertest(sails.hooks.http.app)
    .put(`/api/v1/documents/${documentId}`)
    .set('Authorization', token)
    .set('Accept', 'application/json');

const countDocumentsTitled = async (title) => TDescription.count({ title });

describe('Document PDF page offsets (#1936)', () => {
  let userToken;
  let moderatorToken;
  const createdDocIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  after(async () => {
    await TFile.destroy({ document: createdDocIds });
    await TDescription.destroy({ document: createdDocIds });
    await TDocument.destroy({ id: createdDocIds });
  });

  describe('POST /api/v1/documents', () => {
    let FileService;
    let createSpy;

    before(() => {
      // eslint-disable-next-line global-require
      FileService = require('../../../../api/services/FileService');
    });

    afterEach(() => {
      if (createSpy) createSpy.restore();
      createSpy = undefined;
    });

    it('should store and return a zero identifier offset', async () => {
      const res = await createRequest(userToken, 'Offset zero')
        .field('identifier', 'https://example.org/bulletin.pdf')
        .field('identifierType[id]', 'url')
        .field('identifierPdfPageOffset', '0')
        .expect(200);
      const { id } = res.body.document;
      createdDocIds.push(id);

      should(res.body.document.identifierPdfPageOffset).equal(0);
      const stored = await TDocument.findOne(id);
      should(stored.identifierPdfPageOffset).equal(0);

      const found = await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${id}`)
        .expect(200);
      should(found.body.identifierPdfPageOffset).equal(0);
    });

    it('should default the identifier offset to null when it is omitted', async () => {
      const res = await createRequest(userToken, 'Offset omitted')
        .field('identifier', 'https://example.org/bulletin.pdf')
        .field('identifierType[id]', 'url')
        .expect(200);
      createdDocIds.push(res.body.document.id);
      should(res.body.document.identifierPdfPageOffset).be.null();
    });

    it('should bind each file to its own metadata, whatever order the uploads complete in', async () => {
      // Delay the first upload so it completes last.
      const { create } = FileService.document;
      createSpy = sinon
        .stub(FileService.document, 'create')
        .callsFake(async (...args) => {
          if (args[0].originalname === 'first.pdf')
            await new Promise((resolve) => {
              setTimeout(resolve, 100);
            });
          return create.apply(FileService.document, args);
        });

      const res = await createRequest(userToken, 'Offsets per file')
        .attach('files', Buffer.from('%PDF-1'), 'first.pdf')
        .attach('files', Buffer.from('notes'), 'notes.txt')
        .attach('files', Buffer.from('%PDF-3'), 'third.pdf')
        .attach('files', Buffer.from('%PDF-4'), 'fourth.pdf')
        .field('newFilesMetadata[0][pdfPageOffset]', '+1')
        .field('newFilesMetadata[2][pdfPageOffset]', '-126')
        .field('newFilesMetadata[3][pdfPageOffset]', '')
        .expect(200);
      const { id } = res.body.document;
      createdDocIds.push(id);
      should(createSpy.callCount).equal(4);

      const files = await TFile.find({ document: id });
      const offsetByName = Object.fromEntries(
        files.map((f) => [f.fileName, f.pdfPageOffset])
      );
      should(offsetByName).eql({
        'first.pdf': 1,
        'notes.txt': null,
        'third.pdf': -126,
        'fourth.pdf': null,
      });
      const returned = Object.fromEntries(
        res.body.document.files.map((f) => [f.fileName, f.pdfPageOffset])
      );
      should(returned).eql(offsetByName);
    });

    const rejectedCreations = [
      {
        name: 'a malformed identifier offset',
        fields: {
          identifier: 'https://example.org/a.pdf',
          'identifierType[id]': 'url',
          identifierPdfPageOffset: 'abc',
        },
      },
      {
        name: 'a fractional identifier offset',
        fields: {
          identifier: 'https://example.org/a.pdf',
          'identifierType[id]': 'url',
          identifierPdfPageOffset: '1.5',
        },
      },
      {
        name: 'an out-of-range identifier offset',
        fields: {
          identifier: 'https://example.org/a.pdf',
          'identifierType[id]': 'url',
          identifierPdfPageOffset: '2147483648',
        },
      },
      {
        name: 'an identifier offset on a non-URL identifier',
        fields: {
          identifier: '978-2-12345-680-3',
          'identifierType[id]': 'isbn',
          identifierPdfPageOffset: '1',
        },
      },
      {
        name: 'an identifier offset without identifier',
        fields: { identifierPdfPageOffset: '1' },
      },
      {
        name: 'a file offset on a non-PDF file',
        files: ['notes.txt'],
        fields: { 'newFilesMetadata[0][pdfPageOffset]': '1' },
      },
      {
        name: 'metadata for a file that was not uploaded',
        files: ['a.pdf'],
        fields: { 'newFilesMetadata[1][pdfPageOffset]': '1' },
      },
      {
        name: 'a malformed file offset',
        files: ['a.pdf'],
        fields: { 'newFilesMetadata[0][pdfPageOffset]': '1e3' },
      },
    ];

    rejectedCreations.forEach(({ name, fields, files = [] }, i) => {
      it(`should return 400 and create nothing for ${name}`, async () => {
        const title = `Rejected offset ${i}`;
        let req = createRequest(userToken, title);
        files.forEach((fileName) => {
          req = req.attach('files', Buffer.from('content'), fileName);
        });
        Object.entries(fields).forEach(([key, value]) => {
          req = req.field(key, value);
        });
        await req.expect(400);
        should(await countDocumentsTitled(title)).equal(0);
      });
    });
  });

  describe('PUT /api/v1/documents/:id', () => {
    let documentId;
    let pdfFileId;
    let txtFileId;

    beforeEach(async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 17,
        license: 1,
        isValidated: true,
        dateInscription: new Date(),
        identifier: 'https://example.org/bulletin.pdf',
        identifierType: 'url',
        identifierPdfPageOffset: 3,
      }).fetch();
      documentId = doc.id;
      createdDocIds.push(documentId);
      const [pdf, txt] = await TFile.createEach([
        {
          dateInscription: new Date(),
          fileName: 'bulletin.pdf',
          fileFormat: PDF_FORMAT,
          document: documentId,
          path: 'bulletin.pdf',
          isValidated: true,
          pdfPageOffset: 2,
        },
        {
          dateInscription: new Date(),
          fileName: 'notes.txt',
          fileFormat: TXT_FORMAT,
          document: documentId,
          path: 'notes.txt',
          isValidated: true,
        },
      ]).fetch();
      pdfFileId = pdf.id;
      txtFileId = txt.id;
    });

    const pendingJson = async () =>
      (await TDocument.findOne(documentId)).modifiedDocJson;

    it('should submit a new identifier offset', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifierPdfPageOffset', '1')
        .expect(200);
      should((await pendingJson()).documentData.identifierPdfPageOffset).equal(
        1
      );
    });

    it('should submit an explicit clear of the identifier offset', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifierPdfPageOffset', '')
        .expect(200);
      const { documentData } = await pendingJson();
      should(documentData).have.property('identifierPdfPageOffset', null);
    });

    it('should leave the identifier offset out when it is omitted', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifier', 'https://example.org/bulletin.pdf')
        .field('identifierType[id]', 'url')
        .expect(200);
      const { documentData } = await pendingJson();
      should(documentData).not.have.property('identifierPdfPageOffset');
    });

    it('should clear the identifier offset when the URL changes without one', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifier', 'https://example.org/other.pdf')
        .field('identifierType[id]', 'url')
        .expect(200);
      const { documentData } = await pendingJson();
      should(documentData).have.property('identifierPdfPageOffset', null);
    });

    it('should keep a replacement offset sent with a new URL', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifier', 'https://example.org/other.pdf')
        .field('identifierType[id]', 'url')
        .field('identifierPdfPageOffset', '-4')
        .expect(200);
      should((await pendingJson()).documentData.identifierPdfPageOffset).equal(
        -4
      );
    });

    it('should clear the identifier offset when the identifier type changes', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('identifier', '1234-5678')
        .field('identifierType[id]', 'issn')
        .expect(200);
      const { documentData } = await pendingJson();
      should(documentData).have.property('identifierPdfPageOffset', null);
    });

    it('should submit, clear or leave an existing file offset', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('modifiedFiles[0][id]', String(pdfFileId))
        .field('modifiedFiles[0][fileName]', 'bulletin.pdf')
        .field('modifiedFiles[0][pdfPageOffset]', '0')
        .expect(200);
      should((await pendingJson()).modifiedFiles).eql([
        { id: pdfFileId, fileName: 'bulletin.pdf', pdfPageOffset: 0 },
      ]);

      await updateRequest(moderatorToken, documentId)
        .field('title', 'Updated')
        .field('modifiedFiles[0][id]', String(pdfFileId))
        .field('modifiedFiles[0][fileName]', 'bulletin.pdf')
        .field('modifiedFiles[0][pdfPageOffset]', '')
        .expect(200);
      should((await pendingJson()).modifiedFiles).eql([
        { id: pdfFileId, fileName: 'bulletin.pdf', pdfPageOffset: null },
      ]);

      await updateRequest(moderatorToken, documentId)
        .field('title', 'Updated')
        .field('modifiedFiles[0][id]', String(pdfFileId))
        .field('modifiedFiles[0][fileName]', 'renamed.pdf')
        .expect(200);
      should((await pendingJson()).modifiedFiles).eql([
        { id: pdfFileId, fileName: 'renamed.pdf' },
      ]);

      // The stored file is untouched until the modification is validated.
      should((await TFile.findOne(pdfFileId)).pdfPageOffset).equal(2);
    });

    it('should accept a JSON body for existing files', async () => {
      await updateRequest(userToken, documentId)
        .send({
          title: 'Updated',
          identifierPdfPageOffset: 7,
          modifiedFiles: [
            { id: pdfFileId, fileName: 'bulletin.pdf', pdfPageOffset: -1 },
          ],
        })
        .expect(200);
      const json = await pendingJson();
      should(json.documentData.identifierPdfPageOffset).equal(7);
      should(json.modifiedFiles[0].pdfPageOffset).equal(-1);
    });

    it('should store the offset of a file uploaded with an update on its pending row', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('deletedFiles[0][id]', String(txtFileId))
        .attach('files', Buffer.from('%PDF'), 'supplement.pdf')
        .field('newFilesMetadata[0][pdfPageOffset]', '-126')
        .expect(200);
      const [newFile] = (await pendingJson()).newFiles;
      should(newFile.pdfPageOffset).equal(-126);
      const stored = await TFile.findOne(newFile.id);
      should(stored).containEql({ isValidated: false, pdfPageOffset: -126 });
    });

    const rejectedUpdates = [
      {
        name: 'an existing file of another document',
        fields: () => ({
          'modifiedFiles[0][id]': String(FOREIGN_FILE_ID),
          'modifiedFiles[0][fileName]': 'file4.pdf',
          'modifiedFiles[0][pdfPageOffset]': '1',
        }),
      },
      {
        name: 'the deletion of a file of another document',
        fields: () => ({ 'deletedFiles[0][id]': String(FOREIGN_FILE_ID) }),
      },
      {
        name: 'an offset on an existing non-PDF file',
        fields: ({ txtFileId: id }) => ({
          'modifiedFiles[0][id]': String(id),
          'modifiedFiles[0][fileName]': 'notes.txt',
          'modifiedFiles[0][pdfPageOffset]': '1',
        }),
      },
      {
        name: 'a malformed existing file offset',
        fields: ({ pdfFileId: id }) => ({
          'modifiedFiles[0][id]': String(id),
          'modifiedFiles[0][fileName]': 'bulletin.pdf',
          'modifiedFiles[0][pdfPageOffset]': '-2147483648',
        }),
      },
      {
        name: 'an identifier offset on a new non-URL identifier',
        fields: () => ({
          identifier: '1234-5678',
          'identifierType[id]': 'issn',
          identifierPdfPageOffset: '1',
        }),
      },
      {
        name: 'metadata for a file that was not uploaded',
        fields: () => ({ 'newFilesMetadata[1][pdfPageOffset]': '1' }),
      },
    ];

    rejectedUpdates.forEach(({ name, fields }) => {
      it(`should return 400 and upload nothing for ${name}`, async () => {
        let req = updateRequest(userToken, documentId)
          .field('title', 'Rejected')
          .attach('files', Buffer.from('%PDF'), 'rejected.pdf');
        Object.entries(fields({ pdfFileId, txtFileId })).forEach(
          ([key, value]) => {
            req = req.field(key, value);
          }
        );
        await req.expect(400);
        should(await TFile.count({ document: documentId })).equal(2);
        should(await pendingJson()).be.null();
      });
    });
  });
});
