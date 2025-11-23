const should = require('should');
const TokenService = require('../../../api/services/TokenService');

describe('TokenService', () => {
  describe('issue()', () => {
    it('should issue a token', () => {
      const payload = { id: 1, email: 'test@test.com' };
      const token = TokenService.issue(payload, 3600, 'test');
      should(token).be.a.String();
      should(token.split('.')).have.length(3);
    });
  });

  describe('verify()', () => {
    it('should verify a valid token', (done) => {
      const payload = { id: 1, email: 'test@test.com' };
      const token = TokenService.issue(payload, 3600, 'test');
      TokenService.verify(token, (err, decoded) => {
        should.not.exist(err);
        should(decoded.id).equal(1);
        should(decoded.email).equal('test@test.com');
        done();
      });
    });

    it('should reject an invalid token', (done) => {
      TokenService.verify('invalid.token.here', (err, decoded) => {
        should.exist(err);
        should.not.exist(decoded);
        done();
      });
    });

    it('should verify token with custom salt', (done) => {
      const customSalt = 'customSalt123';
      const payload = { id: 2 };
      const token = TokenService.issue(payload, 3600, 'test', customSalt);
      TokenService.verify(
        token,
        (err, decoded) => {
          should.not.exist(err);
          should(decoded.id).equal(2);
          done();
        },
        customSalt
      );
    });
  });

  describe('getResetPasswordTokenSalt()', () => {
    it('should generate reset password token salt', () => {
      const user = {
        id: 1,
        password: 'hashedpassword',
        dateInscription: new Date('2020-01-01'),
      };
      const salt = TokenService.getResetPasswordTokenSalt(user);
      should(salt).be.a.String();
      should(salt).containEql('hashedpassword');
      should(salt).containEql('1');
    });
  });
});
