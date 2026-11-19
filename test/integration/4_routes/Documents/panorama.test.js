const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');
const {
  gpanoXmp,
  sphereGPano,
  makeImage,
} = require('../../../helpers/panoramaImages');

const JPG_FORMAT = 100;
// t_file 4 belongs to document 2 in the fixtures.
const FOREIGN_FILE_ID = 4;

const createRequest = (token, title) =>
  supertest(sails.hooks.http.app)
    .post('/api/v1/documents')
    .field('description', 'Panorama test document')
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

const flagsByName = (files) =>
  Object.fromEntries(files.map((f) => [f.fileName, f.isPanorama]));

describe('Document panorama files (#2007)', () => {
  let userToken;
  let moderatorToken;
  let FileService;
  let sphere; // complete JPEG sphere with GPano metadata
  let plain2to1; // 2:1 JPEG without GPano metadata
  let notASphere; // 4:3 JPEG
  let viewerOff; // complete sphere with UsePanoramaViewer=False
  let cylindrical; // 2:1 JPEG declaring a cylindrical projection
  const createdDocIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    // eslint-disable-next-line global-require
    FileService = require('../../../../api/services/FileService');
    sphere = await makeImage({
      width: 64,
      height: 32,
      xmp: gpanoXmp(sphereGPano(64, 32)),
    });
    plain2to1 = await makeImage({ width: 64, height: 32 });
    notASphere = await makeImage({ width: 64, height: 48 });
    viewerOff = await makeImage({
      width: 64,
      height: 32,
      xmp: gpanoXmp(sphereGPano(64, 32, { UsePanoramaViewer: 'False' })),
    });
    cylindrical = await makeImage({
      width: 64,
      height: 32,
      xmp: gpanoXmp({ ProjectionType: 'cylindrical' }),
    });
  });

  after(async () => {
    const files = await TFile.find({ document: createdDocIds });
    await Promise.all(
      files.map((f) => FileService.document.deleteStorage(f).catch(() => {}))
    );
    await TFile.destroy({ document: createdDocIds });
    await TDescription.destroy({ document: createdDocIds });
    await TDocument.destroy({ id: createdDocIds });
  });

  describe('POST /api/v1/documents', () => {
    it('should detect, declare or refuse each upload by its own index', async () => {
      const res = await createRequest(userToken, 'Panorama per file')
        .field('newFilesMetadata[0][fileName]', 'detected.jpg')
        .field('newFilesMetadata[1][pdfPageOffset]', '2')
        .field('newFilesMetadata[2][isPanorama]', 'true')
        .field('newFilesMetadata[3][isPanorama]', 'false')
        .field('newFilesMetadata[4][fileName]', 'plain.jpg')
        .field('newFilesMetadata[5][fileName]', 'viewer-off.jpg')
        .attach('files', sphere, 'detected.jpg')
        .attach('files', Buffer.from('%PDF-1'), 'bulletin.pdf')
        .attach('files', plain2to1, 'manual.jpg')
        .attach('files', sphere, 'refused.jpg')
        .attach('files', plain2to1, 'plain.jpg')
        .attach('files', viewerOff, 'viewer-off.jpg')
        .expect(200);
      const { id } = res.body.document;
      createdDocIds.push(id);

      const files = await TFile.find({ document: id });
      const expected = {
        'detected.jpg': true,
        'bulletin.pdf': false,
        'manual.jpg': true,
        'refused.jpg': false,
        'plain.jpg': false,
        'viewer-off.jpg': false,
      };
      should(flagsByName(files)).eql(expected);
      should(
        files.find((f) => f.fileName === 'bulletin.pdf').pdfPageOffset
      ).equal(2);
      should(flagsByName(res.body.document.files)).eql(expected);

      const found = await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${id}`)
        .expect(200);
      should(flagsByName(found.body.files)).eql(expected);
    });

    const rejectedCreations = [
      {
        name: 'an empty flag',
        files: [['a.jpg', 'sphere']],
        fields: { 'newFilesMetadata[0][isPanorama]': '' },
        code: 'E_INVALID_PANORAMA_FLAG',
        field: 'newFilesMetadata[0][isPanorama]',
      },
      {
        name: 'a malformed flag',
        files: [['a.jpg', 'sphere']],
        fields: { 'newFilesMetadata[0][isPanorama]': 'yes' },
        code: 'E_INVALID_PANORAMA_FLAG',
        field: 'newFilesMetadata[0][isPanorama]',
      },
      {
        name: 'a manual panorama that is not 2:1',
        files: [
          ['ok.jpg', 'sphere'],
          ['b.jpg', 'notASphere'],
        ],
        fields: { 'newFilesMetadata[1][isPanorama]': 'true' },
        code: 'E_INCOMPATIBLE_PANORAMA',
        field: 'newFilesMetadata[1][isPanorama]',
        reason: 'NOT_A_COMPLETE_SPHERE',
      },
      {
        name: 'a manual panorama with a cylindrical projection',
        files: [['c.jpg', 'cylindrical']],
        fields: { 'newFilesMetadata[0][isPanorama]': 'true' },
        code: 'E_INCOMPATIBLE_PANORAMA',
        field: 'newFilesMetadata[0][isPanorama]',
        reason: 'UNSUPPORTED_PROJECTION',
      },
      {
        name: 'a manual panorama on a PDF',
        files: [['d.pdf', 'pdf']],
        fields: { 'newFilesMetadata[0][isPanorama]': 'true' },
        code: 'E_INCOMPATIBLE_PANORAMA',
        field: 'newFilesMetadata[0][isPanorama]',
        reason: 'NOT_AN_IMAGE',
      },
    ];

    rejectedCreations.forEach(
      ({ name, files, fields, code, field, reason }, i) => {
        it(`should return a structured 400 and create nothing for ${name}`, async () => {
          const title = `Rejected panorama ${i}`;
          const buffers = {
            sphere,
            notASphere,
            cylindrical,
            pdf: Buffer.from('%PDF-1'),
          };
          let req = createRequest(userToken, title);
          Object.entries(fields).forEach(([key, value]) => {
            req = req.field(key, value);
          });
          files.forEach(([fileName, kind]) => {
            req = req.attach('files', buffers[kind], fileName);
          });
          const res = await req.expect(400);
          should(res.body.code).equal(code);
          should(res.body.metadata.field).equal(field);
          if (reason) should(res.body.metadata.reason).equal(reason);
          should(await countDocumentsTitled(title)).equal(0);
        });
      }
    );
  });

  describe('PUT /api/v1/documents/:id', () => {
    let documentId;
    let plainFileId; // 2:1 image without GPano, not a panorama yet
    let panoramaFileId; // stored as a panorama
    let photoFileId; // 4:3 image

    const pendingJson = async () =>
      (await TDocument.findOne(documentId)).modifiedDocJson;

    const storeFile = async (buffer, fileName, isPanorama) =>
      FileService.document.create(
        { originalname: fileName, buffer, size: buffer.length },
        documentId,
        true,
        true,
        null,
        null,
        isPanorama
      );

    beforeEach(async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 17,
        license: 1,
        isValidated: true,
        dateInscription: new Date(),
      }).fetch();
      documentId = doc.id;
      createdDocIds.push(documentId);
      plainFileId = (await storeFile(plain2to1, 'plain.jpg', false)).id;
      panoramaFileId = (await storeFile(sphere, 'sphere.jpg', true)).id;
      photoFileId = (await storeFile(notASphere, 'photo.jpg', false)).id;
    });

    it('should propose a flag only for the files that send one', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .field('modifiedFiles[0][id]', String(plainFileId))
        .field('modifiedFiles[0][isPanorama]', 'true')
        .field('modifiedFiles[1][id]', String(panoramaFileId))
        .field('modifiedFiles[1][fileName]', 'renamed.jpg')
        .field('modifiedFiles[2][id]', String(photoFileId))
        .field('modifiedFiles[2][isPanorama]', 'false')
        .expect(200);
      should((await pendingJson()).modifiedFiles).eql([
        { id: plainFileId, isPanorama: true },
        { id: panoramaFileId, fileName: 'renamed.jpg' },
        { id: photoFileId, isPanorama: false },
      ]);
      // The stored files are untouched until the modification is validated.
      should((await TFile.findOne(plainFileId)).isPanorama).be.false();
    });

    it('should accept a JSON body', async () => {
      await updateRequest(userToken, documentId)
        .send({
          title: 'Updated',
          modifiedFiles: [{ id: panoramaFileId, isPanorama: false }],
        })
        .expect(200);
      should((await pendingJson()).modifiedFiles).eql([
        { id: panoramaFileId, isPanorama: false },
      ]);
    });

    it('should detect a file uploaded with an update on its pending row', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Updated')
        .attach('files', sphere, 'new-sphere.jpg')
        .expect(200);
      const [newFile] = (await pendingJson()).newFiles;
      should(newFile.isPanorama).be.true();
      should(await TFile.findOne(newFile.id)).containEql({
        isValidated: false,
        isPanorama: true,
      });
    });

    const rejectedUpdates = [
      {
        name: 'a null flag',
        body: ({ plainFileId: id }) => ({
          title: 'Rejected',
          modifiedFiles: [{ id, isPanorama: null }],
        }),
        code: 'E_INVALID_PANORAMA_FLAG',
        field: 'modifiedFiles[0][isPanorama]',
      },
      {
        name: 'a string flag that is not canonical',
        body: ({ plainFileId: id }) => ({
          title: 'Rejected',
          modifiedFiles: [{ id, isPanorama: 'True' }],
        }),
        code: 'E_INVALID_PANORAMA_FLAG',
        field: 'modifiedFiles[0][isPanorama]',
      },
      {
        name: 'a stored image that is not 2:1',
        body: ({ plainFileId: plain, photoFileId: photo }) => ({
          title: 'Rejected',
          modifiedFiles: [
            { id: plain, fileName: 'renamed.jpg' },
            { id: photo, isPanorama: true },
          ],
        }),
        code: 'E_INCOMPATIBLE_PANORAMA',
        field: 'modifiedFiles[1][isPanorama]',
        reason: 'NOT_A_COMPLETE_SPHERE',
      },
      {
        name: 'a file of another document',
        body: () => ({
          title: 'Rejected',
          modifiedFiles: [{ id: FOREIGN_FILE_ID, isPanorama: true }],
        }),
      },
    ];

    rejectedUpdates.forEach(({ name, body, code, field, reason }) => {
      it(`should return 400 and change nothing for ${name}`, async () => {
        const res = await updateRequest(userToken, documentId)
          .send(body({ plainFileId, photoFileId }))
          .expect(400);
        if (code) {
          should(res.body.code).equal(code);
          should(res.body.metadata.field).equal(field);
          if (reason) should(res.body.metadata.reason).equal(reason);
        }
        should(await pendingJson()).be.null();
        should(await TFile.count({ document: documentId })).equal(3);
      });
    });

    it('should not upload anything when an existing file flag is incompatible', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Rejected')
        .field('modifiedFiles[0][id]', String(photoFileId))
        .field('modifiedFiles[0][isPanorama]', 'true')
        .attach('files', sphere, 'new.jpg')
        .expect(400);
      should(await TFile.count({ document: documentId })).equal(3);
      should(await pendingJson()).be.null();
    });

    it('should reject a manual panorama on a non-image file without reading it', async () => {
      const pdf = await TFile.create({
        dateInscription: new Date(),
        fileName: 'bulletin.pdf',
        fileFormat: 1,
        document: documentId,
        path: 'missing-bulletin.pdf',
        isValidated: true,
      }).fetch();
      const res = await updateRequest(userToken, documentId)
        .send({
          title: 'Rejected',
          modifiedFiles: [{ id: pdf.id, isPanorama: true }],
        })
        .expect(400);
      should(res.body.metadata.reason).equal('NOT_AN_IMAGE');
    });

    it('should reject a manual panorama whose stored image cannot be read', async () => {
      const lost = await TFile.create({
        dateInscription: new Date(),
        fileName: 'lost.jpg',
        fileFormat: JPG_FORMAT,
        document: documentId,
        path: 'missing-panorama-test.jpg',
        isValidated: true,
      }).fetch();
      const res = await updateRequest(userToken, documentId)
        .send({
          title: 'Rejected',
          modifiedFiles: [{ id: lost.id, isPanorama: true }],
        })
        .expect(400);
      should(res.body.metadata.reason).equal('UNREADABLE_FILE');
    });
  });

  describe('Pending previews and moderation', () => {
    let documentId;
    let plainFileId;
    let panoramaFileId;

    const getDocument = (query = '') =>
      supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${documentId}${query}`)
        .set('Authorization', moderatorToken)
        .expect(200);

    const moderate = (isValidated) =>
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            { id: documentId, isValidated, validationComment: 'Panoramas' },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(200);

    beforeEach(async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 17,
        license: 1,
        isValidated: true,
        dateInscription: new Date(),
      }).fetch();
      documentId = doc.id;
      createdDocIds.push(documentId);
      const create = (buffer, fileName, isPanorama) =>
        FileService.document.create(
          { originalname: fileName, buffer, size: buffer.length },
          documentId,
          true,
          true,
          null,
          null,
          isPanorama
        );
      plainFileId = (await create(plain2to1, 'plain.jpg', false)).id;
      panoramaFileId = (await create(sphere, 'sphere.jpg', true)).id;
    });

    it('should preview proposed and stored flags, then apply them on validation', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Pending panoramas')
        .field('modifiedFiles[0][id]', String(plainFileId))
        .field('modifiedFiles[0][isPanorama]', 'true')
        .field('modifiedFiles[1][id]', String(panoramaFileId))
        .field('modifiedFiles[1][fileName]', 'renamed.jpg')
        .expect(200);

      const current = await getDocument();
      should(flagsByName(current.body.files)).eql({
        'plain.jpg': false,
        'sphere.jpg': true,
      });

      const preview = await getDocument('?requireUpdate=true');
      should(flagsByName(preview.body.modifiedFiles)).eql({
        'plain.jpg': true,
        'renamed.jpg': true,
      });

      await moderate(true);

      should(await TFile.findOne(plainFileId)).containEql({
        isPanorama: true,
      });
      should(await TFile.findOne(panoramaFileId)).containEql({
        fileName: 'renamed.jpg',
        isPanorama: true,
      });
    });

    it('should preview a deleted panorama with its stored flag', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Pending panorama deletion')
        .field('deletedFiles[0][id]', String(panoramaFileId))
        .field('deletedFiles[1][id]', String(plainFileId))
        .expect(200);

      const preview = await getDocument('?requireUpdate=true');
      should(flagsByName(preview.body.deletedFiles)).eql({
        'sphere.jpg': true,
        'plain.jpg': false,
      });
    });

    it('should keep the flags when the modification is refused', async () => {
      await updateRequest(userToken, documentId)
        .field('title', 'Pending panoramas')
        .field('modifiedFiles[0][id]', String(panoramaFileId))
        .field('modifiedFiles[0][isPanorama]', 'false')
        .expect(200);

      await moderate(false);

      should((await TFile.findOne(panoramaFileId)).isPanorama).be.true();
    });
  });
});
