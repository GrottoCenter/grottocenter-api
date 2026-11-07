const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

// Formats from test/fixtures/tfileformat.json
const PDF = 1;
const JPG = 100;
const PNG = 101;
const SVG = 103;

describe('Entrance featured file (#1701)', () => {
  let userToken;
  let entranceId;
  const documentIds = [];
  const files = {};

  const createDocument = async (data, linked = true) => {
    const document = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
      dateValidation: new Date(),
      ...data,
    }).fetch();
    documentIds.push(document.id);
    if (linked) {
      await TEntrance.addToCollection(entranceId, 'documents', document.id);
    }
    return document.id;
  };

  const createFile = async (document, fileFormat, data = {}) =>
    (
      await TFile.create({
        dateInscription: new Date(),
        fileName: `featured-${document}-${fileFormat}`,
        path: `featured-${document}-${fileFormat}-${Date.now()}`,
        fileFormat,
        document,
        isValidated: true,
        ...data,
      }).fetch()
    ).id;

  const getEntrance = async () =>
    (
      await supertest(sails.hooks.http.app).get(
        `/api/v1/entrances/${entranceId}`
      )
    ).body;

  const put = (body, token = userToken) => {
    const request = supertest(sails.hooks.http.app)
      .put(`/api/v1/entrances/${entranceId}`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');
    if (token) request.set('Authorization', token);
    return request.send(body);
  };

  const storedFeaturedFile = async () =>
    (await TEntrance.findOne(entranceId)).featuredFile;

  const setStored = (featuredFile) =>
    TEntrance.updateOne({ id: entranceId }).set({ featuredFile });

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const entrance = await TEntrance.create({
      latitude: 0,
      longitude: 0,
      altitude: 321,
      cave: 1,
    }).fetch();
    entranceId = entrance.id;
    await TName.create({
      entrance: entranceId,
      name: 'Featured entrance',
      isMain: true,
      author: 1,
      language: 'fra',
      dateInscription: new Date(),
    });

    const linked = await createDocument({});
    files.jpg = await createFile(linked, JPG, {
      thumbnailSmall: 'thumbnails/small/featured.webp',
    });
    files.png = await createFile(linked, PNG);
    files.pdf = await createFile(linked, PDF);
    files.svg = await createFile(linked, SVG);
    files.unvalidated = await createFile(linked, JPG, { isValidated: false });

    const pending = await createDocument({
      isValidated: false,
      dateValidation: null,
    });
    files.ofPendingDocument = await createFile(pending, JPG);

    const unlinked = await createDocument({}, false);
    files.ofUnlinkedDocument = await createFile(unlinked, JPG);

    const refused = await createDocument({ isValidated: false });
    files.ofRefusedDocument = await createFile(refused, JPG);

    const deleted = await createDocument({ isDeleted: true });
    files.ofDeletedDocument = await createFile(deleted, JPG);

    files.toUnlink = await createFile(await createDocument({}), JPG);
  });

  afterEach(() => setStored(null));

  after(async () => {
    await TFile.destroy({ document: documentIds });
    await JDocumentEntrance.destroy({ entrance: entranceId });
    await TDocument.destroy({ id: documentIds });
    await TName.destroy({ entrance: entranceId });
    await TEntrance.destroy({ id: entranceId });
  });

  describe('GET /api/v1/entrances/:id', () => {
    it('returns null when no file is selected', async () => {
      const entrance = await getEntrance();
      should(entrance).have.property('featuredFile', null);
    });

    it('returns the compact file with partial thumbnails', async () => {
      await setStored(files.jpg);
      const { featuredFile } = await getEntrance();
      should(featuredFile).have.only.keys(
        'id',
        'fileName',
        'completePath',
        'thumbnails'
      );
      should(featuredFile.id).equal(files.jpg);
      should(featuredFile.fileName).equal(`featured-${documentIds[0]}-${JPG}`);
      should(featuredFile.completePath).be.a.String();
      should(featuredFile.thumbnails.small).match(/featured\.webp$/);
      should(featuredFile.thumbnails.medium).be.null();
      should(featuredFile.thumbnails.large).be.null();
    });

    it('returns thumbnails null when the image has none', async () => {
      await setStored(files.png);
      const { featuredFile } = await getEntrance();
      should(featuredFile.id).equal(files.png);
      should(featuredFile.thumbnails).be.null();
    });

    it('hides a file that is no longer eligible', async () => {
      for (const ineligible of [
        files.unvalidated,
        files.pdf,
        files.ofUnlinkedDocument,
        files.ofRefusedDocument,
        files.ofDeletedDocument,
      ]) {
        // eslint-disable-next-line no-await-in-loop
        await setStored(ineligible);
        // eslint-disable-next-line no-await-in-loop
        const entrance = await getEntrance();
        should(entrance.featuredFile).be.null();
      }
    });

    it('hides the file once its document is unlinked', async () => {
      await setStored(files.toUnlink);
      should((await getEntrance()).featuredFile.id).equal(files.toUnlink);

      const file = await TFile.findOne(files.toUnlink);
      await TEntrance.removeFromCollection(
        entranceId,
        'documents',
        file.document
      );
      should((await getEntrance()).featuredFile).be.null();
    });
  });

  describe('PUT /api/v1/entrances/:id', () => {
    it('requires authentication', async () => {
      await put({ featuredFile: files.jpg }, null).expect(401);
      should(await storedFeaturedFile()).be.null();
    });

    it('selects a file from a body holding only featuredFile', async () => {
      const before = await TEntrance.findOne(entranceId).populate('names');
      const res = await put({ featuredFile: files.jpg }).expect(200);

      should(res.body.featuredFile.id).equal(files.jpg);
      should(res.body.featuredFile.thumbnails.small).match(/featured\.webp$/);
      should(await storedFeaturedFile()).equal(files.jpg);

      const after = await TEntrance.findOne(entranceId).populate('names');
      should(after.geology).equal(before.geology);
      should(after.altitude).equal(321);
      should(after.cave).equal(before.cave);
      should(after.names[0].name).equal('Featured entrance');
      should(after.names[0].language).equal('fra');
    });

    it('selects a file of a document awaiting validation', async () => {
      await put({ featuredFile: files.ofPendingDocument }).expect(200);
      should(await storedFeaturedFile()).equal(files.ofPendingDocument);
    });

    it('accepts the id as a numeric string', async () => {
      await put({ featuredFile: String(files.png) }).expect(200);
      should(await storedFeaturedFile()).equal(files.png);
    });

    it('clears the selection with null', async () => {
      await setStored(files.jpg);
      const res = await put({ featuredFile: null }).expect(200);
      should(res.body.featuredFile).be.null();
      should(await storedFeaturedFile()).be.null();
    });

    it('keeps the selection when the field is omitted', async () => {
      await setStored(files.jpg);
      const res = await put({
        altitude: 654,
        name: { text: 'Featured entrance', language: 'fra' },
      }).expect(200);
      should(res.body.featuredFile.id).equal(files.jpg);
      should(await storedFeaturedFile()).equal(files.jpg);
      should((await TEntrance.findOne(entranceId)).altitude).equal(654);
      await TEntrance.updateOne({ id: entranceId }).set({ altitude: 321 });
    });

    it('selects a file within a full update', async () => {
      const res = await put({
        featuredFile: files.png,
        name: { text: 'Featured entrance', language: 'fra' },
      }).expect(200);
      should(res.body.featuredFile.id).equal(files.png);
      should(await storedFeaturedFile()).equal(files.png);
    });

    it('returns 404 for a file that does not exist', async () => {
      await setStored(files.jpg);
      await put({ featuredFile: 987654321 }).expect(404);
      should(await storedFeaturedFile()).equal(files.jpg);
    });

    it('returns 404 for the largest int4 id, as number or string', async () => {
      await setStored(files.jpg);
      await put({ featuredFile: 2147483647 }).expect(404);
      await put({ featuredFile: '2147483647' }).expect(404);
      should(await storedFeaturedFile()).equal(files.jpg);
    });

    describe('rejects an invalid selection with 400 and keeps the current one', () => {
      const cases = [
        ['a non-numeric value', () => 'abc'],
        ['zero', () => 0],
        ['a decimal', () => 1.5],
        ['an id above the int4 range', () => 2147483648],
        ['an id above the int4 range as a string', () => '2147483648'],
        ['an id far above the int4 range', () => Number.MAX_SAFE_INTEGER],
        ['an object', () => ({ id: files.png })],
        ['a file of an unlinked document', () => files.ofUnlinkedDocument],
        ['a PDF', () => files.pdf],
        ['an SVG', () => files.svg],
        ['an unvalidated file', () => files.unvalidated],
        ['a file of a refused document', () => files.ofRefusedDocument],
        ['a file of a deleted document', () => files.ofDeletedDocument],
      ];
      cases.forEach(([label, value]) => {
        it(label, async () => {
          await setStored(files.jpg);
          await put({ featuredFile: value() }).expect(400);
          should(await storedFeaturedFile()).equal(files.jpg);
        });
      });

      it('within a full update, without writing the other fields', async () => {
        await setStored(files.jpg);
        await put({
          featuredFile: files.pdf,
          altitude: 999,
          name: { text: 'Renamed', language: 'fra' },
        }).expect(400);
        const after = await TEntrance.findOne(entranceId).populate('names');
        should(after.featuredFile).equal(files.jpg);
        should(after.altitude).equal(321);
        should(after.names[0].name).equal('Featured entrance');
      });
    });
  });
}).timeout(20000);
