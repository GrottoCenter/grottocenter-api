const should = require('should');
const { TOTP } = require('otplib');
const MfaService = require('../../../api/services/MfaService');

describe('MFA config', () => {
  describe('adminAuthTokenTTL', () => {
    it('should equal 864000 (10 days in seconds)', () => {
      should(sails.config.custom.adminAuthTokenTTL).equal(864000);
    });
  });

  describe('mfaDevSecret', () => {
    it('should be set to JBSWY3DPEHPK3PXP in test env', () => {
      should(sails.config.custom.mfaDevSecret).equal('JBSWY3DPEHPK3PXP');
    });
  });

  describe('mfaIssuerName', () => {
    it("should equal 'Grottocenter (test)' in test env", () => {
      should(sails.config.custom.mfaIssuerName).equal('Grottocenter (test)');
    });
  });

  describe('mfaEncryptionKey', () => {
    it('should be a 64-character hex string', () => {
      const key = sails.config.custom.mfaEncryptionKey;
      should(key).be.a.String();
      should(key).have.length(64);
      should(key).match(/^[0-9a-f]{64}$/);
    });
  });

  describe('otplib dependency', () => {
    it('should generate and verify a TOTP code via MfaService', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const totp = new TOTP({ ...MfaService.TOTP_OPTIONS, secret });
      const code = await totp.generate();

      should(code).be.a.String();
      should(code).match(/^\d{6}$/);

      const isValid = await MfaService.verifyCode(code, secret);
      should(isValid).be.true();
    });
  });
});
