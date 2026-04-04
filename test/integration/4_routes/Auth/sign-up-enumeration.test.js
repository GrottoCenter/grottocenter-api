const supertest = require('supertest');
const should = require('should');

describe('Auth features', () => {
  describe('Sign-up enumeration prevention', () => {
    const GENERIC_MESSAGE = 'Email or nickname is already used.';

    describe('Duplicate email', () => {
      const duplicateEmail = 'admin1@admin1.com';

      it('should return 409 with generic conflict message', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: duplicateEmail,
            nickname: 'UniqueNickname123',
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409);

        should(res.body).have.property('message', GENERIC_MESSAGE);
      });

      it('should NOT contain the specific email address in the response body', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: duplicateEmail,
            nickname: 'UniqueNickname456',
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409);

        const bodyStr = JSON.stringify(res.body);
        should(bodyStr).not.containEql(duplicateEmail);
      });
    });

    describe('Duplicate nickname', () => {
      const duplicateNickname = 'Admin1';

      it('should return 409 with generic conflict message', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'unique-email@example.com',
            nickname: duplicateNickname,
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409);

        should(res.body).have.property('message', GENERIC_MESSAGE);
      });

      it('should NOT contain the specific nickname in the response body', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'unique-email2@example.com',
            nickname: duplicateNickname,
            password: 'securepassword',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409);

        const bodyStr = JSON.stringify(res.body);
        should(bodyStr).not.containEql(duplicateNickname);
      });
    });
  });
});
