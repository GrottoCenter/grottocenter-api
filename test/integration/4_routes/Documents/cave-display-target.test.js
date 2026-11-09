const supertest = require('supertest');
const should = require('should');

// Documents attached to a cave surface on the page that shows the cave: the
// entrance page of a single-entrance cave, the cave page of a network (#1735).
// In the fixtures, cave 1 is a network (entrances 1 and 2) and cave 2 has a
// single entrance (3).
describe('Documents attached to a cave (#1735)', () => {
  const createdDocIds = [];
  let singleEntranceCaveDoc;
  let networkDoc;
  let refusedDoc;
  let deletedDoc;
  let alsoOnEntranceDoc;
  let noCaveDoc;

  const createEntrance = (fields) =>
    TEntrance.create({
      author: 1,
      cave: 2,
      latitude: 45.3,
      longitude: 5.3,
      ...fields,
    }).fetch();

  const get = (path) =>
    supertest(sails.hooks.http.app)
      .get(`/api/v1/${path}`)
      .set('Accept', 'application/json')
      .expect(200);

  before(async () => {
    const create = async (fields) => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        ...fields,
      }).fetch();
      createdDocIds.push(doc.id);
      return doc;
    };
    singleEntranceCaveDoc = await create({ cave: 2 });
    networkDoc = await create({ cave: 1 });
    refusedDoc = await create({
      cave: 2,
      isValidated: false,
      dateValidation: new Date(),
    });
    deletedDoc = await create({ cave: 2, isDeleted: true });
    alsoOnEntranceDoc = await create({ cave: 2 });
    noCaveDoc = await create({});
    await JDocumentEntrance.create({
      document: alsoOnEntranceDoc.id,
      entrance: 3,
    });
  });

  after(async () => {
    await JDocumentEntrance.destroy({ document: createdDocIds });
    await TDocument.destroy({ id: createdDocIds });
  });

  describe('GET /documents/:id attachedTo', () => {
    it('should point a single-entrance cave document to its entrance', async () => {
      const res = await get(`documents/${singleEntranceCaveDoc.id}`);
      should(res.body.cave.id).equal(2);
      should(res.body.attachedTo).containEql({ type: 'entrance', id: 3 });
      should(res.body.attachedTo).have.property('name');
    });

    it('should point a network document to its cave', async () => {
      const res = await get(`documents/${networkDoc.id}`);
      should(res.body.attachedTo).containEql({ type: 'cave', id: 1 });
      should(res.body.attachedTo).have.property('name');
    });

    it('should give a null attachedTo to a document without a cave', async () => {
      const res = await get(`documents/${noCaveDoc.id}`);
      should(res.body.attachedTo).be.null();
    });

    it('should ignore a deleted entrance when counting the entrances', async () => {
      const extra = await createEntrance({ isDeleted: true });
      try {
        const res = await get(`documents/${singleEntranceCaveDoc.id}`);
        should(res.body.attachedTo).containEql({ type: 'entrance', id: 3 });
      } finally {
        await TEntrance.destroy({ id: extra.id });
      }
    });

    it('should point to the cave once it has a second entrance', async () => {
      const extra = await createEntrance({});
      try {
        const res = await get(`documents/${singleEntranceCaveDoc.id}`);
        should(res.body.attachedTo).containEql({ type: 'cave', id: 2 });
      } finally {
        await TEntrance.destroy({ id: extra.id });
      }
    });

    it('should keep the stored cave for a pending edit without a cave', async () => {
      // A document update leaves the cave to the cave linking endpoint, so
      // its pending change carries no cave.
      const pending = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        cave: 2,
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 17 },
          descriptionData: { title: 'Modified', body: 'Modified body' },
        },
      }).fetch();
      createdDocIds.push(pending.id);

      const res = await get(`documents/${pending.id}?requireUpdate=true`);
      should(res.body.title).equal('Modified');
      should(res.body.cave.id).equal(2);
      should(res.body.attachedTo).containEql({ type: 'entrance', id: 3 });
    });
  });

  describe('GET /entrances/:id caveDocuments', () => {
    it("should list the cave's documents on the entrance of a single-entrance cave", async () => {
      const res = await get('entrances/3');
      const ids = res.body.caveDocuments.map((d) => d.id);
      should(ids).containEql(singleEntranceCaveDoc.id);
      should(ids).not.containEql(refusedDoc.id);
      should(ids).not.containEql(deletedDoc.id);
    });

    it('should not repeat a document already linked to the entrance', async () => {
      const res = await get('entrances/3');
      should(res.body.caveDocuments.map((d) => d.id)).not.containEql(
        alsoOnEntranceDoc.id
      );
      should(res.body.documents.map((d) => d.id)).containEql(
        alsoOnEntranceDoc.id
      );
    });

    it('should carry the citation fields of a document card', async () => {
      const res = await get('entrances/3');
      const doc = res.body.caveDocuments.find(
        (d) => d.id === singleEntranceCaveDoc.id
      );
      should(doc).have.properties(['type', 'authors', 'oldBBS']);
    });

    it("should keep a network's documents on its cave page", async () => {
      const entranceRes = await get('entrances/1');
      should(entranceRes.body.caveDocuments).be.an.Array().and.be.empty();

      const caveRes = await get('caves/1');
      should(caveRes.body.documents.map((d) => d.id)).containEql(networkDoc.id);
    });
  });
});
