const AuthService = require('./AuthService');

module.exports = {
  getResetPasswordTokenSalt: (user) => {
    const { dateInscription, id, password } = user;
    return password + id + dateInscription + AuthService.tokenSalt;
  },
};
