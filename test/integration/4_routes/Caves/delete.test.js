const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deleteIsPermanentCases = require('../../deleteIsPermanentCases');

describe('Cave features', () => {
  let moderatorToken;
  let adminToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 403 for non-moderator', async () => {
      const userToken = await AuthTokenService.getRawBearerUserToken();
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/caves/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(403);
    });

    describe('Invalid parameter', () => {
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${987654321}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });
    describe('Successfull delete', () => {
      let caveToDeleteId;
      before(async () => {
        caveToDeleteId = (await TCave.create({}).fetch()).id;
        should(caveToDeleteId).not.be.undefined();
      });

      after(async () => {
        // A soft delete keeps the row, as the production trigger does
        should((await TCave.findOne(caveToDeleteId)).isDeleted).be.true();
        await TCave.destroyOne(caveToDeleteId);
      });

      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${caveToDeleteId}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
  });

  describe('Delete', () => {
    // Merge & delete is tested in details in the CaveService.test.js file
    describe('Successfull delete', () => {
      const destinationCaveDepth = 5423;
      const destinationCaveTemperature = 42;
      const sourceCaveDepth = 1111;
      const sourceCaveLength = 323;
      let destinationCaveId;
      let sourceCaveId;

      before(async () => {
        destinationCaveId = (
          await TCave.create({
            depth: destinationCaveDepth,
            temperature: destinationCaveTemperature,
          }).fetch()
        ).id;
        sourceCaveId = (
          await TCave.create({
            depth: sourceCaveDepth,
            caveLength: sourceCaveLength,
          }).fetch()
        ).id;
        should(destinationCaveId).not.be.undefined();
        should(sourceCaveId).not.be.undefined();
      });

      after(async () => {
        should((await TCave.findOne(sourceCaveId)).isDeleted).be.true();
        await TCave.destroy({ id: [sourceCaveId, destinationCaveId] });
      });

      it('should return code 200 on successfull caves merge', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${sourceCaveId}`)
          .send()
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });

    describe('Permanent delete with redirect', () => {
      let caveId;
      let targetCaveId;

      before(async () => {
        caveId = (await TCave.create({}).fetch()).id;
        targetCaveId = (await TCave.create({}).fetch()).id;
      });

      after(async () => {
        await TCave.destroy({ id: [caveId, targetCaveId] });
      });

      it('should soft delete and set redirectTo when entityId is provided', async () => {
        await supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${caveId}?entityId=${targetCaveId}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .expect(200);

        const deletedCave = await TCave.findOne(caveId);
        should(deletedCave.isDeleted).be.true();
        should(deletedCave.redirectTo).equal(targetCaveId);
      });
    });

    describe('Permanent delete with entrances', () => {
      let caveWithEntranceId;
      let entranceId;

      before(async () => {
        caveWithEntranceId = (await TCave.create({}).fetch()).id;
        entranceId = (
          await TEntrance.create({
            cave: caveWithEntranceId,
            latitude: 45.0,
            longitude: 6.0,
          }).fetch()
        ).id;
      });

      after(async () => {
        await TEntrance.destroy({ id: entranceId });
        await TCave.destroy({ id: caveWithEntranceId });
      });

      it('should return 400 when trying to permanently delete cave with entrances without merge target', async () => {
        await supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${caveWithEntranceId}?isPermanent=true`)
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .expect(400);
      });
    });
  });

  describe('Permanent merge into an unavailable target (#1982)', () => {
    it('should return 400 when the merge target is deleted, instead of falling back on a plain delete', async () => {
      const cave = await TCave.create({}).fetch();
      const entrance = await TEntrance.create({
        cave: cave.id,
        latitude: 45.0,
        longitude: 6.0,
      }).fetch();
      const deletedTarget = await TCave.create({ isDeleted: true }).fetch();
      try {
        const res = await supertest(sails.hooks.http.app)
          .delete(
            `/api/v1/caves/${cave.id}?isPermanent=true&entityId=${deletedTarget.id}`
          )
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .expect(400);
        should(res.body.message).match(/cannot be merged into/);
        // The entrance was not moved to the deleted target
        const kept = await TEntrance.findOne({ id: entrance.id });
        should(kept.cave).equal(cave.id);
      } finally {
        await TEntrance.destroy({ id: entrance.id });
        await TCave.destroy({ id: [cave.id, deletedTarget.id] });
      }
    });
  });

  deleteIsPermanentCases({
    getToken: () => adminToken,

    getModeratorToken: () => moderatorToken,
    getModel: () => TCave,
    createEntity: () => TCave.create({}).fetch(),
    deleteUrl: (id) => `/api/v1/caves/${id}`,
    findEntity: (id) => TCave.findOne(id),
    observe: 'notification',
  });
});
