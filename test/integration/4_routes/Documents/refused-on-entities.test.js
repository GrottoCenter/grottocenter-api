const supertest = require('supertest');
const should = require('should');

// A refused submission (isValidated false with a dateValidation) is not shown
// on the entities it is linked to, while a pending one still is (#1907).
describe('Refused documents on entity pages', () => {
  const createdDocIds = [];
  let refused;
  let pending;

  before(async () => {
    const create = (fields) =>
      TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        cave: 1,
        ...fields,
      }).fetch();
    refused = await create({ dateValidation: new Date() });
    pending = await create({ dateValidation: null });
    createdDocIds.push(refused.id, pending.id);
    await JDocumentEntrance.createEach(
      createdDocIds.map((document) => ({ document, entrance: 1 }))
    );
    await JDocumentMassif.createEach(
      createdDocIds.map((document) => ({ document, massif: 1 }))
    );
  });

  after(async () => {
    await JDocumentEntrance.destroy({ document: createdDocIds });
    await JDocumentMassif.destroy({ document: createdDocIds });
    await TDocument.destroy({ id: createdDocIds });
  });

  ['entrances', 'caves', 'massifs'].forEach((entities) => {
    it(`should list a pending document but not a refused one on ${entities}`, async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/${entities}/1`)
        .set('Accept', 'application/json')
        .expect(200);

      const ids = res.body.documents.map((d) => d.id);
      should(ids).containEql(pending.id);
      should(ids).not.containEql(refused.id);
    });
  });
});
