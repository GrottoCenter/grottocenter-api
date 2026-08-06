const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Auth features', () => {
  describe('Sign-up anti-bot protection', () => {
    let originalEnabled;
    let originalSecret;
    const createdEmails = [];

    beforeEach(() => {
      originalEnabled = process.env.TURNSTILE_ENABLED;
      originalSecret = process.env.TURNSTILE_SECRET_KEY;
    });

    afterEach(async () => {
      // Restore env vars
      if (originalEnabled === undefined) {
        delete process.env.TURNSTILE_ENABLED;
      } else {
        process.env.TURNSTILE_ENABLED = originalEnabled;
      }
      if (originalSecret === undefined) {
        delete process.env.TURNSTILE_SECRET_KEY;
      } else {
        process.env.TURNSTILE_SECRET_KEY = originalSecret;
      }
      sinon.restore();
    });

    after(async () => {
      // Clean up any cavers created during tests
      if (createdEmails.length > 0) {
        await TCaver.destroy({ mail: createdEmails });
      }
    });

    describe('Defense ordering', () => {
      it('should return 204 when honeypot is filled, even with invalid captcha (honeypot wins)', async () => {
        process.env.TURNSTILE_ENABLED = 'true';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        // Stub fetch to reject with CAPTCHA_INVALID if called
        sinon.stub(global, 'fetch').resolves({
          ok: true,
          status: 200,
          json: async () => ({ success: false }),
        });

        await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'honeypot-ordering@example.com',
            nickname: 'honeypotorder',
            password: 'Secure_pass1!',
            website: 'http://spam.example.com',
            captchaToken: 'invalid-token',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });
    });

    describe('Honeypot rejection', () => {
      it('should not create a caver when honeypot is triggered', async () => {
        process.env.TURNSTILE_ENABLED = 'false';

        const testEmail = `honeypot-nocreate-${Date.now()}@example.com`;

        await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: `hpnc${Date.now()}`,
            password: 'Secure_pass1!',
            website: 'http://bot.example.com',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).be.undefined();
      });
    });

    describe('Turnstile rejection (missing token)', () => {
      it('should return 400 with CAPTCHA_MISSING and not create a caver', async () => {
        process.env.TURNSTILE_ENABLED = 'true';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        const testEmail = `turnstile-missing-${Date.now()}@example.com`;

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: `tsmiss${Date.now()}`,
            password: 'Secure_pass1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400);

        should(res.body).have.property('error', 'CAPTCHA_MISSING');

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).be.undefined();
      });
    });

    describe('Turnstile rejection (invalid token)', () => {
      it('should return 400 with CAPTCHA_INVALID and not create a caver', async () => {
        process.env.TURNSTILE_ENABLED = 'true';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        sinon.stub(global, 'fetch').resolves({
          ok: true,
          status: 200,
          json: async () => ({
            success: false,
            'error-codes': ['invalid-input-response'],
          }),
        });

        const testEmail = `turnstile-invalid-${Date.now()}@example.com`;

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: `tsinv${Date.now()}`,
            password: 'Secure_pass1!',
            captchaToken: 'bad-token',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400);

        should(res.body).have.property('error', 'CAPTCHA_INVALID');

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).be.undefined();
      });
    });

    describe('Turnstile service unavailable', () => {
      it('should return 503 with CAPTCHA_SERVICE_UNAVAILABLE', async () => {
        process.env.TURNSTILE_ENABLED = 'true';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        sinon.stub(global, 'fetch').rejects(new Error('Network error'));

        const testEmail = `turnstile-503-${Date.now()}@example.com`;

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: `ts503${Date.now()}`,
            password: 'Secure_pass1!',
            captchaToken: 'some-token',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(503);

        should(res.body).have.property('error', 'CAPTCHA_SERVICE_UNAVAILABLE');

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).be.undefined();
      });
    });

    describe('Happy path (Turnstile enabled)', () => {
      it('should create a caver when honeypot is empty and captcha is valid', async () => {
        process.env.TURNSTILE_ENABLED = 'true';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';

        sinon.stub(global, 'fetch').resolves({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

        const testEmail = `antibot-happy-${Date.now()}@example.com`;
        const testNickname = `abhappy${Date.now()}`;
        createdEmails.push(testEmail);

        await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: testNickname,
            password: 'Secure_pass1!',
            captchaToken: 'valid-token',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).not.be.undefined();
        should(caver.nickname).equal(testNickname);
        should(caver.activated).be.false();
      });
    });

    describe('Happy path (Turnstile disabled)', () => {
      it('should create a caver without captchaToken when Turnstile is disabled', async () => {
        process.env.TURNSTILE_ENABLED = 'false';

        const testEmail = `antibot-disabled-${Date.now()}@example.com`;
        const testNickname = `abdis${Date.now()}`;
        createdEmails.push(testEmail);

        await supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: testEmail,
            nickname: testNickname,
            password: 'Secure_pass1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const caver = await TCaver.findOne({ mail: testEmail });
        should(caver).not.be.undefined();
        should(caver.nickname).equal(testNickname);
        should(caver.activated).be.false();
      });
    });
  });
});
