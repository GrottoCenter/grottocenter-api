/**
 */

const documentController = require('../DocumentController');

module.exports = {
  count: (req, res, next) => documentController.count(req, res, next),
  create: (req, res, next) => documentController.create(req, res, next),
  findAll: (req, res, next) => documentController.findAll(req, res, next),
  findByCaverId: (req, res, next) => documentController.findByCaverId(req, res, next),
  find: (req, res, next) => documentController.find(req, res, next),
  findChildren: (req, res) => documentController.findChildren(req, res),
  update: (req, res, next) => documentController.update(req, res, next),
  updateWithNewEntities: (req, res) => documentController.updateWithNewEntities(req, res),
  validate: (req, res) => documentController.validate(req, res),
  multipleValidate: (req, res) => documentController.multipleValidate(req, res),
  checkRows: (req, res) => documentController.checkRows(req, res),
  importRows: (req, res) => documentController.importRows(req, res),
};
