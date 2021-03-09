/**
 */

const documentController = require('../DocumentController');

module.exports = {
  count: (req, res, next) => documentController.count(req, res, next),
  create: (req, res, next) => documentController.create(req, res, next),
  findAll: (req, res, next) => documentController.findAll(req, res, next),
  find: (req, res, next) => documentController.find(req, res, next),
  update: (req, res, next) => documentController.update(req, res, next),
  validate: (req, res, next) => documentController.validate(req, res, next),
  multipleValidate: (req, res, next) =>
    documentController.multipleValidate(req, res, next),
};
