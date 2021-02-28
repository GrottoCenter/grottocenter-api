/**
 */

const authController = require('../AuthController');

module.exports = {
  forgotPassword: (req, res) => authController.forgotPassword(req, res),
  login: (req, res) => authController.login(req, res),
  logout: (req, res) => authController.logout(req, res),
  signUp: (req, res) => authController.signUp(req, res),
};
