const supertest = require('supertest');

describe('Auth features', () => {
  describe('Login', () => {
    describe('Email missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Password missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'unknown@test.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Bad email', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'bad_email', password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Bad password', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'test@test.com', password: 'bad_password' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Good credentials', () => {
      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'admin1@admin1.com', password: 'testtest' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
  });

  describe('Sign Up', () => {
    describe('Email missing', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            nickname: 'NewTest',
            password: 'new_password',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Password missing', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'NewTest',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Password too short', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'NewTest',
            password: 'pass',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Nickname already used', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'Admin1',
            password: 'new_password',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Minimal data', () => {
      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'NewTest',
            password: 'new_password',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
    describe('Complete data', () => {
      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest2@newtest2.com',
            name: 'Bob',
            nickname: 'NewTest2',
            password: 'new_password',
            surname: 'Testuser',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
    describe('Email conflict', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'admin1@admin1.com',
            nickname: 'NewTest3',
            password: 'new_password',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Nickname conflict', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest2@newtest2.com',
            nickname: 'Admin1',
            password: 'new_password',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
  });

  describe('Log out', () => {
    it('should return code 400', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/logout')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
  });
});
