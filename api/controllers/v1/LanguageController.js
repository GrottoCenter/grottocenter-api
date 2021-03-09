/**
 */

const languageController = require('../LanguageController');

module.exports = {
  find: (req, res, next) => languageController.find(req, res, next),
  findAll: (req, res, next) => languageController.findAll(req, res, next),
};
