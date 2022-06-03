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
    it('should raise an error if the user token do not match with the caver to edit', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should modify the caver data with userToken', (done) => {
      const newName = 'NewName';
      const newNickname = 'NewNickname';
      const newsurname = 'newSurname';

      const update = {
        name: newName,
        nickname: newNickname,
        surname: newsurname,
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/3')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const caver = res.body;
          should(caver.name).equal(update.name);
          should(caver.nickname).equal(update.nickname);
          should(caver.surname).equal(update.surname);
          return done();
        });
    });

    it('should modify the caver data execept email and password with AdminToken', (done) => {
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
    it('should raise an error if an admin try to edit the mail and password of a caver', (done) => {
      const newMail = 'test@test.com';
      const update = {
        mail: newMail,
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/6')
        .send(update)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });
  });
});
