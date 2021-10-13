let supertest = require('supertest');

describe('AuthController', () => {
  describe('Login', () => {
    describe('Login missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end(done);
      });
    });

    describe('Password missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'unknown@test.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end(done);
      });
    });

    describe('Bad email', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'bad_email', password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end(done);
      });
    });

    describe('Bad password', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'test@test.com', password: 'bad_password' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end(done);
      });
    });

    describe('Good credentials', () => {
      it('should return code 200', (done) => {
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

  describe('Sign Up', () => {
    describe('Sign up missing data', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end(done);
      });
    });
  });
});
