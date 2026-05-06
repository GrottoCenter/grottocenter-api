const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let userToken;
  let adminToken;
  let moderatorToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  it('should raise an error if a non-existing id of a caver is passed ', (done) => {
    supertest(sails.hooks.http.app)
      .put('/api/v1/caver/123456789')
      .send({})
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(404, done);
  });

  describe('Update the caver data using different token', () => {
    it('should raise an error if a non-admin user tries to edit a caver', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should raise an error if a non-admin user tries to edit their own profile via this endpoint', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/3')
        .send({ name: 'NewName' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should modify the caver data with AdminToken', (done) => {
      const newName = 'NewName2';
      const newNickname = 'NewNickname2';
      const newSurname = 'newSurname2';
      const newOrganizations = [{ id: 1 }, { id: 3 }];

      const update = {
        name: newName,
        nickname: newNickname,
        surname: newSurname,
        organizations: newOrganizations,
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send(update)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);
          const caver = await TCaver.findOne(6).populate('grottos');
          should(caver.name).equal(update.name);
          should(caver.nickname).equal(update.nickname);
          should(caver.surname).equal(update.surname);
          should(caver.grottos.length).equal(2);
          should(caver.grottos).containDeep([{ id: 1 }, { id: 3 }]);
          return done();
        });
    });

    it('should not modify the caver data with moderatorToken', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send({})
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });
    it('should not modify the caver data without token', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send({})
        .set('Authorization', null)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('Only authorized field should be updated', () => {
    it('should raise an error if changes are requested on unauthorized fields', (done) => {
      const newRandomField = 'random';
      const update = {
        randomField: newRandomField,
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send(update)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
    it('should raise an error if an admin tries to edit mail (not an updatable field)', (done) => {
      const update = {
        mail: 'test@test.com',
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send(update)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
  });
});
