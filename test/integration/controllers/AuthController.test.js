let request = require('supertest');

describe('AuthController', function() {

  describe('#login_ko()', function() {
    it('should redirect to /auth/login', function (done) {
      request(sails.hooks.http.app)
        .post('/auth/validate')
        .send({ contact: 'unknown@test.com', password: 'test' })
        .expect(302)
        .expect('location','/auth/login', done);
    });
  });

  describe('#login_ok()', function() {
    it('should redirect to /', function (done) {
      request(sails.hooks.http.app)
        .post('/auth/validate')
        .send({ contact: 'test@test.com', password: 'test' })
        .expect(302)
        .expect('location','/', done);
    });
  });

});
