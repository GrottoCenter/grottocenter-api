/**
 */

const authController = require('../AuthController');

module.exports = {
  login: (req, res) => authController.login(req, res),
  logout: (req, res) => authController.logout(req, res),
  signUp: (req, res) => authController.signUp(req, res),
};
