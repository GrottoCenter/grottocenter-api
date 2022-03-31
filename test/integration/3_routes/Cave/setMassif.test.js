const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Set massif', () => {
    const existingCaveId = 1;
    const existingMassifId = 1;
    describe('Invalid parameters', () => {
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${987654321}/massif/${existingMassifId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
      it('should return code 404 on inexisting massif', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${existingCaveId}/massif/${123456789}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Successfull setMassif', () => {
      after(async () => {
        // Remove massif set
        await TCave.update(existingCaveId).set({ massif: undefined });
        const existingCave = await TCave.findOne(existingCaveId);
        should(existingCave.massif).be.undefined();
      });

      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${existingCaveId}/massif/${existingMassifId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });
});
