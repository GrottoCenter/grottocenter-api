const supertest = require('supertest');
const should = require('should');

describe('Document find-children', () => {
  let parentDocId;
  let childDocId;

  before(async () => {
    const parentDoc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    parentDocId = parentDoc.id;

    const childDoc = await TDocument.create({
      author: 1,
      type: 17,
      license: 1,
      parent: parentDocId,
      isValidated: true,
    }).fetch();
    childDocId = childDoc.id;
  });

  after(async () => {
    await TDocument.destroy({ id: childDocId });
    await TDocument.destroy({ id: parentDocId });
  });

  describe('GET /api/v1/documents/:id/children', () => {
    it('should return 404 for non-existent document', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/documents/999999/children')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 200 with children documents', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${parentDocId}/children`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('documents');
      should(res.body.documents).be.an.Array();
      should(res.body.documents.length).be.above(0);
    });
  });
});
