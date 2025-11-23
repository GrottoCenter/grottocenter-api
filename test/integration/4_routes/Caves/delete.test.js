const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
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
        should(await TCave.findOne(caveToDeleteId)).be.undefined();
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
        should(await TCave.findOne(sourceCaveId)).be.undefined();
        await TCave.destroyOne(destinationCaveId);
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
        await TCave.destroy({ id: targetCaveId });
      });

      it('should soft delete and set redirectTo when entityId is provided', async () => {
        await supertest(sails.hooks.http.app)
          .delete(`/api/v1/caves/${caveId}?entityId=${targetCaveId}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .expect(200);

        const deletedCave = await TCave.findOne(caveId).meta({
          enableExperimentalDeepTargets: true,
        });
        should(deletedCave).be.undefined();
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
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .expect(400);
      });
    });
  });
});
