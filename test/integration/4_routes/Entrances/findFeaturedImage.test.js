const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

// Formats from test/fixtures/tfileformat.json
const PDF = 1;
const JPG = 100;
const PNG = 101;
const SVG = 103;

describe('GET /api/v1/entrances/:entranceId/featured-image (#1992)', () => {
  let moderatorToken;
  let userToken;
  let entranceId;
  let mergeTargetId;
  const entranceIds = [];
  const documentIds = [];
  const files = {};

  const createEntrance = async (data = {}, name = null) => {
    const entrance = await TEntrance.create({
      latitude: 45.1,
      longitude: 6.2,
      altitude: 321,
      cave: 1,
      ...data,
    }).fetch();
    entranceIds.push(entrance.id);
    if (name) {
      await TName.create({
        entrance: entrance.id,
        name,
        isMain: true,
        author: 1,
        language: 'fra',
        dateInscription: new Date(),
      });
    }
    return entrance.id;
  };

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
        fileName: `popup-${document}-${fileFormat}.img`,
        path: `popup-${document}-${fileFormat}-${Date.now()}`,
        fileFormat,
        document,
        isValidated: true,
        ...data,
      }).fetch()
    ).id;

  const get = (id = entranceId, token = null) => {
    const request = supertest(sails.hooks.http.app)
      .get(`/api/v1/entrances/${id}/featured-image`)
      .set('Accept', 'application/json');
    if (token) request.set('Authorization', token);
    return request;
  };

  const setEntrance = (data) =>
    TEntrance.updateOne({ id: entranceId }).set(data);

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    mergeTargetId = await createEntrance({}, 'Merge target');
    entranceId = await createEntrance({}, 'Popup entrance');
    await TName.create({
      entrance: entranceId,
      name: 'Secondary name',
      isMain: false,
      author: 1,
      language: 'eng',
      dateInscription: new Date(),
    });

    const linked = await createDocument({});
    files.jpg = await createFile(linked, JPG, {
      thumbnailSmall: 'thumbnails/small/popup.webp',
      thumbnailMedium: 'thumbnails/medium/popup.webp',
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

    const merged = await createDocument({
      isDeleted: true,
      redirectTo: linked,
    });
    files.ofMergedDocument = await createFile(merged, JPG);

    files.toUnlink = await createFile(await createDocument({}), JPG);
  });

  afterEach(() =>
    setEntrance({ featuredFile: null, isDeleted: false, redirectTo: null })
  );

  after(async () => {
    await TFile.destroy({ document: documentIds });
    await JDocumentEntrance.destroy({ entrance: entranceIds });
    await TDocument.destroy({ id: documentIds });
    await TName.destroy({ entrance: entranceIds });
    await TEntrance.destroy({ id: entranceIds });
  });

  describe('validation', () => {
    ['0', '-1', 'abc', '558_', '2147483648'].forEach((id) => {
      it(`returns 404 for the id ${id}`, async () => {
        await get(id).expect(404);
      });
    });

    it('returns 404 for an entrance that does not exist', async () => {
      await get(987654321).expect(404);
    });
  });

  it('returns the name and a null featuredFile when none is selected', async () => {
    const { body } = await get().expect(200);
    should(body).eql({
      id: entranceId,
      name: 'Popup entrance',
      isDeleted: false,
      redirectTo: null,
      featuredFile: null,
    });
  });

  it('returns only the image metadata of an eligible file', async () => {
    await setEntrance({ featuredFile: files.jpg });
    const { body } = await get().expect(200);
    should(body).have.only.keys(
      'id',
      'name',
      'isDeleted',
      'redirectTo',
      'featuredFile'
    );
    should(body.featuredFile).have.only.keys(
      'id',
      'fileName',
      'completePath',
      'thumbnails'
    );
    should(body.featuredFile.id).equal(files.jpg);
    should(body.featuredFile.fileName).equal(
      `popup-${documentIds[0]}-${JPG}.img`
    );
    should(body.featuredFile.completePath).be.a.String();
    should(body.featuredFile.thumbnails.small).match(/small\/popup\.webp$/);
    should(body.featuredFile.thumbnails.medium).match(/medium\/popup\.webp$/);
    should(body.featuredFile.thumbnails.large).be.null();
  });

  it('matches the featuredFile of the detail endpoint', async () => {
    await setEntrance({ featuredFile: files.jpg });
    const [{ body: light }, { body: detail }] = await Promise.all([
      get().expect(200),
      supertest(sails.hooks.http.app)
        .get(`/api/v1/entrances/${entranceId}`)
        .expect(200),
    ]);
    should(light.featuredFile).eql(detail.featuredFile);
    should(light.name).equal(detail.name);
  });

  it('returns thumbnails null when the image has none', async () => {
    await setEntrance({ featuredFile: files.png });
    const { body } = await get().expect(200);
    should(body.featuredFile.id).equal(files.png);
    should(body.featuredFile.thumbnails).be.null();
  });

  it('returns a file of a document awaiting validation', async () => {
    await setEntrance({ featuredFile: files.ofPendingDocument });
    const { body } = await get().expect(200);
    should(body.featuredFile.id).equal(files.ofPendingDocument);
  });

  describe('returns 200 with a null featuredFile for', () => {
    const cases = [
      ['an unvalidated file', 'unvalidated'],
      ['a PDF', 'pdf'],
      ['an SVG', 'svg'],
      ['a file of an unlinked document', 'ofUnlinkedDocument'],
      ['a file of a refused document', 'ofRefusedDocument'],
      ['a file of a deleted document', 'ofDeletedDocument'],
      ['a file of a merged document', 'ofMergedDocument'],
    ];
    cases.forEach(([label, key]) => {
      it(label, async () => {
        await setEntrance({ featuredFile: files[key] });
        const { body } = await get().expect(200);
        should(body.featuredFile).be.null();
      });
    });

    it('a file whose document was unlinked after the selection', async () => {
      await setEntrance({ featuredFile: files.toUnlink });
      should((await get().expect(200)).body.featuredFile.id).equal(
        files.toUnlink
      );

      const file = await TFile.findOne(files.toUnlink);
      await TEntrance.removeFromCollection(
        entranceId,
        'documents',
        file.document
      );
      should((await get().expect(200)).body.featuredFile).be.null();
    });
  });

  describe('entrance visibility', () => {
    it('hides the file of a deleted entrance from anonymous visitors', async () => {
      await setEntrance({ featuredFile: files.jpg, isDeleted: true });
      const { body } = await get().expect(200);
      should(body).eql({
        id: entranceId,
        name: 'Popup entrance',
        isDeleted: true,
        redirectTo: null,
        featuredFile: null,
      });
    });

    it('answers a deleted entrance like the detail endpoint', async () => {
      await setEntrance({ featuredFile: files.jpg, isDeleted: true });
      const detail = await supertest(sails.hooks.http.app).get(
        `/api/v1/entrances/${entranceId}`
      );
      const light = await get();
      should(light.status).equal(detail.status);
      should(light.body.isDeleted).equal(detail.body.isDeleted);
      should(light.body.name).equal(detail.body.name);
      should(detail.body.featuredFile).be.undefined();
    });

    it('hides the file of a deleted entrance from users', async () => {
      await setEntrance({ featuredFile: files.jpg, isDeleted: true });
      const { body } = await get(entranceId, userToken).expect(200);
      should(body.featuredFile).be.null();
    });

    it('shows the file of a deleted entrance to moderators', async () => {
      await setEntrance({ featuredFile: files.jpg, isDeleted: true });
      const { body } = await get(entranceId, moderatorToken).expect(200);
      should(body.isDeleted).be.true();
      should(body.featuredFile.id).equal(files.jpg);
    });

    it('exposes the redirect of a merged entrance', async () => {
      await setEntrance({
        featuredFile: files.jpg,
        isDeleted: true,
        redirectTo: mergeTargetId,
      });
      const { body } = await get().expect(200);
      should(body.redirectTo).equal(mergeTargetId);
      should(body.featuredFile).be.null();
    });

    it('never exposes coordinates, even to moderators', async () => {
      await setEntrance({ featuredFile: files.jpg, isSensitive: true });
      const { body } = await get(entranceId, moderatorToken).expect(200);
      should(body).not.have.properties([
        'latitude',
        'longitude',
        'locations',
        'documents',
        'author',
      ]);
      await setEntrance({ isSensitive: false });
    });
  });
}).timeout(20000);
