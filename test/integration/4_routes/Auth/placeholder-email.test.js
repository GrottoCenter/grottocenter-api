const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');

// Placeholder emails belong to authors (credit-only cavers without an account).
const authorEmail = '4456@mail.no';
const freshPlaceholderEmail = 'fresh-placeholder@mail.no';

describe('Placeholder @mail.no emails', () => {
  let AuthService;

  before(() => {
    // eslint-disable-next-line global-require
    AuthService = require('../../../../api/services/AuthService');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/v1/login', () => {
    it('should return 401 Mismatch without trying to authenticate', async () => {
      const authenticate = sinon.spy(AuthService, 'authenticate');

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: authorEmail, password: 'whatever' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      should(res.body.status).equal('Mismatch');
      should(authenticate.callCount).equal(0);
    });
  });

  describe('POST /api/v1/signup', () => {
    after(async () => {
      await TCaver.destroy({ mail: freshPlaceholderEmail });
    });

    it('should return 400 and create no caver', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/signup')
        .send({
          email: freshPlaceholderEmail,
          nickname: 'FreshPlaceholder',
          password: 'New_password1!',
        })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);

      const caver = await TCaver.findOne({ mail: freshPlaceholderEmail });
      should(caver).be.undefined();
    });
  });

  describe('POST /api/v1/forgotPassword', () => {
    it('should return 400 and send no email', async () => {
      const sendEmail = {
        with: sinon.stub().returns({
          intercept: sinon.stub().resolves(),
        }),
      };
      sinon.stub(sails.helpers, 'sendEmail').value(sendEmail);

      await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: authorEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);

      should(sendEmail.with.callCount).equal(0);
    });
  });
});
