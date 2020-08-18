/**
 */

const documentTypeController = require('../DocumentTypeController');

module.exports = {
  find: (req, res, next) => documentTypeController.find(req, res, next),
  findAll: (req, res, next) => documentTypeController.findAll(req, res, next),
};
