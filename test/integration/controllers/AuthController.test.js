let supertest = require('supertest');

describe('AuthController', function() {
  describe('Login missing', function() {
    it('should return code 401', function(done) {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ password: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
  });

  describe('Password missing', function() {
    it('should return code 401', function(done) {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: 'unknown@test.com' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
  });

  describe('Bad email', function() {
    it('should return code 401', function(done) {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: 'bad_email', password: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
  });

  describe('Bad password', function() {
    it('should return code 401', function(done) {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: 'test@test.com', password: 'bad_password' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
  });

  describe('Good credentials', function() {
    it('should return code 200', function(done) {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: 'test@test.com', password: 'testtest' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(done);
    });
  });
});
