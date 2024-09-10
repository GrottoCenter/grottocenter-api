const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
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
  });
});
