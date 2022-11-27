const TokenService = require('./TokenService');

module.exports = {
  getResetPasswordTokenSalt: (user) => {
    const { dateInscription, id, password } = user;
    return password + id + dateInscription + TokenService.tokenSalt;
  },
};
