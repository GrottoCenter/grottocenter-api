/**
 */

const languageController = require('../LanguageController');

module.exports = {
  find: (req, res) => languageController.find(req, res),
  findAll: (req, res) => languageController.findAll(req, res),
};
