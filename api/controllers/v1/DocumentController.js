/**
 */

const documentController = require('../DocumentController');

module.exports = {
  count: (req, res, next) => documentController.count(req, res, next),
  create: (req, res, next) => documentController.create(req, res, next),
  findAll: (req, res, next) => documentController.findAll(req, res, next),
};
