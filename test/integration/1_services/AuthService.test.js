const should = require('should');
const AuthService = require('../../../api/services/AuthService');

describe('AuthService', () => {
  describe('createHashedPassword()', () => {
    it('should create a hashed password', async () => {
      const hash = await AuthService.createHashedPassword('testpassword');
      should(hash).be.a.String();
      should(hash).startWith('$argon2');
    });
  });

  describe('authenticate()', () => {
    it('should return MISMATCH when email is null', async () => {
      const result = await AuthService.authenticate(null, 'password');
      should(result.status).equal(AuthService.authenticateResult.MISMATCH);
    });

    it('should return MISMATCH when password is null', async () => {
      const result = await AuthService.authenticate('test@test.com', null);
      should(result.status).equal(AuthService.authenticateResult.MISMATCH);
    });

    it('should return MISMATCH when user not found', async () => {
      const result = await AuthService.authenticate(
        'nonexistent@test.com',
        'password'
      );
      should(result.status).equal(AuthService.authenticateResult.MISMATCH);
    });

    it('should return SUCCESS for valid credentials', async () => {
      const result = await AuthService.authenticate(
        'admin1@admin1.com',
        'testtest'
      );
      should(result.status).equal(AuthService.authenticateResult.SUCCESS);
      should.exist(result.user);
    });

    it('should return MISMATCH for invalid password', async () => {
      const result = await AuthService.authenticate(
        'admin1@admin1.com',
        'wrongpassword'
      );
      should(result.status).equal(AuthService.authenticateResult.MISMATCH);
    });
  });
});
