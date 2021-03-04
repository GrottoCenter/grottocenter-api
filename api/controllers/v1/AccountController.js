/**
 */

const accountController = require('../AccountController');

module.exports = {
  changeEmail: (req, res) => accountController.changeEmail(req, res),
  changePassword: (req, res) => accountController.changePassword(req, res),
  forgotPassword: (req, res) => accountController.forgotPassword(req, res),
};
