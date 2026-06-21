const should = require('should');
const SsoService = require('../../../api/services/SsoService');

describe('SsoService', () => {
  describe('resolveSalt()', () => {
    afterEach(() => {
      delete process.env.SSO_SALT_SUPERSET;
    });

    it('should return error 400 when product is missing', () => {
      const result = SsoService.resolveSalt(undefined);
      should(result.error).be.a.String();
      should(result.status).equal(400);
    });

    it('should return error 400 when product is empty string', () => {
      const result = SsoService.resolveSalt('');
      should(result.error).be.a.String();
      should(result.status).equal(400);
    });

    it('should return error 400 when product is not a string', () => {
      const result = SsoService.resolveSalt(123);
      should(result.error).be.a.String();
      should(result.status).equal(400);
    });

    it('should return error 400 for unknown product', () => {
      const result = SsoService.resolveSalt('unknown_product');
      should(result.error).be.a.String();
      should(result.status).equal(400);
      should(result.error).containEql('not supported');
    });

    it('should return error 500 when env var is not set', () => {
      delete process.env.SSO_SALT_SUPERSET;
      const result = SsoService.resolveSalt('superset');
      should(result.error).be.a.String();
      should(result.status).equal(500);
    });

    it('should return error 500 when env var is empty', () => {
      process.env.SSO_SALT_SUPERSET = '';
      const result = SsoService.resolveSalt('superset');
      should(result.error).be.a.String();
      should(result.status).equal(500);
    });

    it('should return error 500 when env var is whitespace only', () => {
      process.env.SSO_SALT_SUPERSET = '   ';
      const result = SsoService.resolveSalt('superset');
      should(result.error).be.a.String();
      should(result.status).equal(500);
    });

    it('should return salt for valid product with configured env var', () => {
      process.env.SSO_SALT_SUPERSET = 'test-secret-123';
      const result = SsoService.resolveSalt('superset');
      should(result.salt).equal('test-secret-123');
      should(result.error).be.undefined();
    });
  });

  describe('buildPayload()', () => {
    it('should build correct payload with all caver fields', () => {
      const caver = { id: 42, name: 'Jean', surname: 'Dupont' };
      const payload = SsoService.buildPayload(caver, 'superset');

      should(payload.sub).equal(42);
      should(payload.aud).equal('superset');
      should(payload.email).equal('42@grottocenter.org');
      should(payload.firstName).equal('Jean');
      should(payload.lastName).equal('Dupont');
      should(payload.jti).match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should use empty string for null name', () => {
      const caver = { id: 1, name: null, surname: 'Smith' };
      const payload = SsoService.buildPayload(caver, 'superset');

      should(payload.firstName).equal('');
      should(payload.lastName).equal('Smith');
    });

    it('should use empty string for undefined surname', () => {
      const caver = { id: 1, name: 'Test' };
      const payload = SsoService.buildPayload(caver, 'superset');

      should(payload.firstName).equal('Test');
      should(payload.lastName).equal('');
    });

    it('should use empty string for empty name and surname', () => {
      const caver = { id: 5, name: '', surname: '' };
      const payload = SsoService.buildPayload(caver, 'superset');

      should(payload.firstName).equal('');
      should(payload.lastName).equal('');
    });
  });

  describe('issueToken()', () => {
    afterEach(() => {
      delete process.env.SSO_SALT_SUPERSET;
    });

    it('should return a signed JWT for valid inputs', () => {
      process.env.SSO_SALT_SUPERSET = 'my-test-salt';
      const caver = { id: 10, name: 'Alice', surname: 'Doe' };
      const result = SsoService.issueToken(caver, 'superset');

      should(result.token).be.a.String();
      should(result.error).be.undefined();

      // Verify the token can be decoded
      // eslint-disable-next-line global-require
      const jsonwebtoken = require('jsonwebtoken');
      const decoded = jsonwebtoken.verify(result.token, 'my-test-salt');
      should(decoded.sub).equal(10);
      should(decoded.aud).equal('superset');
      should(decoded.email).equal('10@grottocenter.org');
      should(decoded.firstName).equal('Alice');
      should(decoded.lastName).equal('Doe');
      should(decoded.exp - decoded.iat).equal(30);
    });

    it('should return error for invalid product', () => {
      const caver = { id: 1, name: 'Test', surname: 'User' };
      const result = SsoService.issueToken(caver, 'invalid');

      should(result.error).be.a.String();
      should(result.status).equal(400);
      should(result.token).be.undefined();
    });

    it('should return error when salt is not configured', () => {
      delete process.env.SSO_SALT_SUPERSET;
      const caver = { id: 1, name: 'Test', surname: 'User' };
      const result = SsoService.issueToken(caver, 'superset');

      should(result.error).be.a.String();
      should(result.status).equal(500);
      should(result.token).be.undefined();
    });
  });
});
