let supertest = require('supertest');
let should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CAVE_PROPERTIES = require('./CAVE_PROPERTIES.js');

describe('Cave features', () => {
  let adminToken;
  before(async () => {
    sails.log.info('Asking for admin auth token...');
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    describe('Invalid parameter', () => {
      it('should return code 400 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .delete('/api/v1/caves/' + 987654321)
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
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

      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .delete('/api/v1/caves/' + caveToDeleteId)
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });

  describe('Merge and delete', () => {
    describe('Invalid parameter', () => {
      let caveToDeleteId;
      before(async () => {
        caveToDeleteId = (await TCave.create({}).fetch()).id;
        should(caveToDeleteId).not.be.undefined();
      });

      after(async () => {
        await TCave.destroyOne(caveToDeleteId);
      });

      it('should return code 400 on inexisting destination cave', (done) => {
        supertest(sails.hooks.http.app)
          .delete('/api/v1/caves/' + caveToDeleteId)
          .send({ destinationCaveForOrphan: 123456789 })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    // Merge & delete is tested in details in the CaveService.test.js file
    describe('Successfull merge', () => {
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
            length: sourceCaveLength,
          }).fetch()
        ).id;
        should(destinationCaveId).not.be.undefined();
        should(sourceCaveId).not.be.undefined();
      });

      after(async () => {
        const resultCave = await TCave.findOne(destinationCaveId);
        should(resultCave.depth).equal(destinationCaveDepth);
        should(resultCave.temperature).equal(destinationCaveTemperature);
        should(resultCave.length).equal(sourceCaveLength);
        should(await TCave.findOne(sourceCaveId)).be.undefined();
        await TCave.destroyOne(destinationCaveId);
      });

      it('should return code 204 on successfull caves merge', (done) => {
        supertest(sails.hooks.http.app)
          .delete('/api/v1/caves/' + sourceCaveId)
          .send({ destinationCaveForOrphan: destinationCaveId })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });
});
