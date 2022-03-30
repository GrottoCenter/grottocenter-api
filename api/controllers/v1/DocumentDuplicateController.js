/**
 */

const documentDuplicateController = require('../DocumentDuplicateController');

module.exports = {
  createMany: (req, res) => documentDuplicateController.createMany(req, res),
  createFromDuplicate: (req, res) => documentDuplicateController.createFromDuplicate(req, res),
  delete: (req, res) => documentDuplicateController.delete(req, res),
  deleteMany: (req, res) => documentDuplicateController.deleteMany(req, res),
  find: (req, res) => documentDuplicateController.find(req, res),
  findAll: (req, res) => documentDuplicateController.findAll(req, res),
};
