const should = require('should');

describe('TCaver MFA attributes', () => {
  describe('MFA attributes are recognized by Waterline', () => {
    it('should include totpSecret attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('totpSecret');
    });

    it('should include mfaEnabled attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('mfaEnabled');
    });

    it('should include totpFailedAttempts attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('totpFailedAttempts');
    });

    it('should include loginFailedAttempts attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('loginFailedAttempts');
    });

    it('should include lastUsedTotp attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('lastUsedTotp');
    });

    it('should include lastUsedTotpAt attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('lastUsedTotpAt');
    });

    it('should include lastFailedLoginAt attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('lastFailedLoginAt');
    });

    it('should include lastSuspiciousEmailAt attribute', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.should.have.property('lastSuspiciousEmailAt');
    });
  });

  describe('MFA default values', () => {
    it('should default mfaEnabled to false', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.mfaEnabled.should.be.exactly(false);
    });

    it('should default totpFailedAttempts to 0', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.totpFailedAttempts.should.be.exactly(0);
    });

    it('should default loginFailedAttempts to 0', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.loginFailedAttempts.should.be.exactly(0);
    });
  });

  describe('MFA nullable fields default to null', () => {
    it('should default totpSecret to null', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      should(caver.totpSecret).be.null();
    });

    it('should default lastUsedTotp to null', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      should(caver.lastUsedTotp).be.null();
    });

    it('should default lastUsedTotpAt to null', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      should(caver.lastUsedTotpAt).be.null();
    });

    it('should default lastFailedLoginAt to null', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      should(caver.lastFailedLoginAt).be.null();
    });

    it('should default lastSuspiciousEmailAt to null', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      should(caver.lastSuspiciousEmailAt).be.null();
    });
  });
});
