/* getUsers.test.js */

const supertest = require('supertest');
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

  it('should return page 1 users with adminToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/1')
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('data');
        res.body.should.have.property('pagination');

        res.body.data.should.be.an.Array().and.have.lengthOf(100);

        res.body.pagination.should.have.property('page', 1);
        res.body.pagination.should.have.property('limit', 100);
        res.body.pagination.should.have.property('total');
        res.body.pagination.should.have.property('totalPages');
        return done();
      });
  });

  it('should return page 2 users with adminToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/2')
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('data');
        res.body.should.have.property('pagination');

        res.body.data.should.be.an.Array().and.have.lengthOf(8);

        res.body.pagination.should.have.property('page', 2);
        res.body.pagination.should.have.property('limit', 100);
        res.body.pagination.should.have.property('total');
        res.body.pagination.should.have.property('totalPages');
        return done();
      });
  });

  it('should return page 1 users with moderatorToken', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/1')
      .set('Authorization', moderatorToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('data');
        res.body.should.have.property('pagination');

        res.body.data.should.be.an.Array().and.have.lengthOf(100);

        res.body.pagination.should.have.property('page', 1);
        res.body.pagination.should.have.property('limit', 100);
        res.body.pagination.should.have.property('total');
        res.body.pagination.should.have.property('totalPages');
        return done();
      });
  });

  it('should return unauthorized error', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/1')
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.deepEqual({
          message: 'You are not authorized to access this endpoint',
        });
        return done();
      });
  });

  it('should return badRequest error', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/-1')
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.deepEqual({
          message: 'Invalid page parameter. Page must be a positive integer.',
        });
        return done();
      });
  });

  it('should return 404 error', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/users/100')
      .set('Authorization', adminToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.deepEqual({
          message: 'Page not found',
        });
        return done();
      });
  });
});
