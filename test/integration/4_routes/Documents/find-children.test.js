const supertest = require('supertest');
const should = require('should');

describe('Document find-children', () => {
  let parentDocId;
  let childWithFileId;
  let childWithUnvalidatedFileId;
  let childWithoutFileId;
  const fileIds = [];

  const createChild = async () =>
    (
      await TDocument.create({
        author: 1,
        type: 17,
        license: 1,
        parent: parentDocId,
        isValidated: true,
      }).fetch()
    ).id;

  const createFile = async (document, isValidated) => {
    const file = await TFile.create({
      dateInscription: new Date(),
      fileName: `child-${document}.pdf`,
      path: `child-${document}.pdf`,
      fileFormat: 1,
      document,
      isValidated,
    }).fetch();
    fileIds.push(file.id);
  };

  before(async () => {
    const parentDoc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    parentDocId = parentDoc.id;

    childWithFileId = await createChild();
    childWithUnvalidatedFileId = await createChild();
    childWithoutFileId = await createChild();
    await createFile(childWithFileId, true);
    await createFile(childWithFileId, false);
    await createFile(childWithUnvalidatedFileId, false);
  });

  after(async () => {
    await TFile.destroy({ id: fileIds });
    await TDocument.destroy({
      id: [childWithFileId, childWithUnvalidatedFileId, childWithoutFileId],
    });
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
      should(res.body.documents.length).be.equal(3);
    });

    it('should flag the children having at least one validated file', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${parentDocId}/children`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const hasFilesById = Object.fromEntries(
        res.body.documents.map((d) => [d.id, d.hasFiles])
      );
      should(hasFilesById).be.deepEqual({
        [childWithFileId]: true,
        [childWithUnvalidatedFileId]: false,
        [childWithoutFileId]: false,
      });
    });

    it('should not expose a files list on the children', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${parentDocId}/children`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      res.body.documents.forEach((d) => should(d).not.have.property('files'));
    });
  });
});
