/**
 */

const accountController = require('../AccountController');

module.exports = {
  changePassword: (req, res) => accountController.changePassword(req, res),
  forgotPassword: (req, res) => accountController.forgotPassword(req, res),
};
