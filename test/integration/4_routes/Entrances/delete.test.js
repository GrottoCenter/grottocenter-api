const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deleteIsPermanentCases = require('../../deleteIsPermanentCases');

describe('Entrance features', () => {
  let userToken;
  let moderatorToken;
  let adminToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrances/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when entrance does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrances/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should soft delete an entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should soft delete with redirectTo', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}?entityId=1`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      should(res.body.redirectTo).equal(1);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should handle already deleted entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should permanently delete an entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TEntrance.findOne(entrance.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete and merge into another entrance', async () => {
      const targetEntrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${entrance.id}?isPermanent=true&entityId=${targetEntrance.id}`
        )
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TEntrance.findOne(entrance.id);
      should(deleted).be.undefined();

      // Clean up target entrance
      await TEntrance.destroy({ id: targetEntrance.id });
    });

    it('should merge documents already linked to the target entrance (#1902)', async () => {
      const [targetEntrance, entrance] = await Promise.all(
        [false, true].map((isDeleted) =>
          TEntrance.create({
            author: 1,
            latitude: '0',
            longitude: '0',
            isDeleted,
          }).fetch()
        )
      );
      const [sharedDocument, ownDocument] = await Promise.all(
        [1, 2].map(() =>
          TDocument.create({ author: 1, type: 1, license: 1 }).fetch()
        )
      );
      await JDocumentEntrance.createEach([
        { document: sharedDocument.id, entrance: targetEntrance.id },
        { document: sharedDocument.id, entrance: entrance.id },
        { document: ownDocument.id, entrance: entrance.id },
      ]);

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${entrance.id}?isPermanent=true&entityId=${targetEntrance.id}`
        )
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(await TEntrance.findOne(entrance.id)).be.undefined();
      const links = await JDocumentEntrance.find({
        document: [sharedDocument.id, ownDocument.id],
      });
      should(
        links.map((l) => [l.document, l.entrance]).sort((a, b) => a[0] - b[0])
      ).eql([
        [sharedDocument.id, targetEntrance.id],
        [ownDocument.id, targetEntrance.id],
      ]);

      await JDocumentEntrance.destroy({ entrance: targetEntrance.id });
      await TDocument.destroy({ id: [sharedDocument.id, ownDocument.id] });
      await TEntrance.destroy({ id: targetEntrance.id });
    });

    describe('when j_document_entrance has no id column, as in production (#2014)', () => {
      // Waterline builds the test table with an id column that the production
      // table, keyed by (id_document, id_entrance), does not have.
      before(() =>
        CommonService.query('ALTER TABLE j_document_entrance DROP COLUMN id')
      );
      after(() =>
        CommonService.query(
          'ALTER TABLE j_document_entrance ADD COLUMN id serial PRIMARY KEY'
        )
      );

      it('should merge an entrance with documents into another entrance', async () => {
        const [targetEntrance, entrance] = await Promise.all(
          [false, true].map((isDeleted) =>
            TEntrance.create({
              author: 1,
              latitude: '0',
              longitude: '0',
              isDeleted,
            }).fetch()
          )
        );
        const [sharedDocument, ownDocument] = await Promise.all(
          [1, 2].map(() =>
            TDocument.create({ author: 1, type: 1, license: 1 }).fetch()
          )
        );
        const documentIds = [sharedDocument.id, ownDocument.id];
        await CommonService.query(
          `INSERT INTO j_document_entrance (id_document, id_entrance)
           VALUES ($1, $2), ($1, $3), ($4, $3)`,
          [sharedDocument.id, targetEntrance.id, entrance.id, ownDocument.id]
        );

        await supertest(sails.hooks.http.app)
          .delete(
            `/api/v1/entrances/${entrance.id}?isPermanent=true&entityId=${targetEntrance.id}`
          )
          .set('Authorization', adminToken)
          .set('Accept', 'application/json')
          .expect(200);

        should(await TEntrance.findOne(entrance.id)).be.undefined();
        const { rows } = await CommonService.query(
          `SELECT id_document, id_entrance FROM j_document_entrance
           WHERE id_document = ANY($1) ORDER BY id_document`,
          [documentIds]
        );
        should(rows.map((r) => [r.id_document, r.id_entrance])).eql([
          [sharedDocument.id, targetEntrance.id],
          [ownDocument.id, targetEntrance.id],
        ]);

        await CommonService.query(
          'DELETE FROM j_document_entrance WHERE id_entrance = $1',
          [targetEntrance.id]
        );
        await TDocument.destroy({ id: documentIds });
        await TEntrance.destroy({ id: targetEntrance.id });
      });
    });
  });

  deleteIsPermanentCases({
    getToken: () => adminToken,

    getModeratorToken: () => moderatorToken,
    getModel: () => TEntrance,
    createEntity: () =>
      TEntrance.create({ author: 1, latitude: '0', longitude: '0' }).fetch(),
    deleteUrl: (id) => `/api/v1/entrances/${id}`,
    findEntity: (id) => TEntrance.findOne(id),
    observe: 'notification',
  });
});
